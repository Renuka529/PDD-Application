import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

// Automatic base URL detection for Android Emulator vs Web/iOS Simulator
String get apiBase {
  if (kIsWeb) {
    return 'http://localhost:8000';
  } else if (Platform.isAndroid) {
    return 'http://10.133.234.57:8000'; // Direct Local Wi-Fi connection
  } else {
    return 'http://10.133.234.57:8000';
  }
}

class ClinicalRecord {
  final DateTime timestamp;
  final bool smoking;
  final bool diabetes;
  final double hba1c;
  final double plaqueIndex;
  final double bleedingOnProbing;
  final double boneLossAverage;
  final double attachmentLossAverage;

  ClinicalRecord({
    required this.timestamp,
    required this.smoking,
    required this.diabetes,
    required this.hba1c,
    required this.plaqueIndex,
    required this.bleedingOnProbing,
    required this.boneLossAverage,
    required this.attachmentLossAverage,
  });

  factory ClinicalRecord.fromJson(Map<String, dynamic> json) {
    return ClinicalRecord(
      timestamp: DateTime.parse(json['timestamp']),
      smoking: json['smoking'] ?? false,
      diabetes: json['diabetes'] ?? false,
      hba1c: (json['hba1c'] as num).toDouble(),
      plaqueIndex: (json['plaque_index'] as num).toDouble(),
      bleedingOnProbing: (json['bleeding_on_probing'] as num).toDouble(),
      boneLossAverage: (json['bone_loss_average'] as num).toDouble(),
      attachmentLossAverage: (json['attachment_loss_average'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'smoking': smoking,
    'diabetes': diabetes,
    'hba1c': hba1c,
    'plaque_index': plaqueIndex,
    'bleeding_on_probing': bleedingOnProbing,
    'bone_loss_average': boneLossAverage,
    'attachment_loss_average': attachmentLossAverage,
  };
}

class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final List<ClinicalRecord> history;
  final DateTime createdAt;

  Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.history,
    required this.createdAt,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    var historyList = json['history'] as List? ?? [];
    List<ClinicalRecord> records = historyList.map((i) => ClinicalRecord.fromJson(i)).toList();

    return Patient(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      age: json['age'] ?? 0,
      gender: json['gender'] ?? '',
      history: records,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class ForecastDataPoint {
  final int month;
  final double boneLoss;
  final double attachmentLoss;

  ForecastDataPoint({
    required this.month,
    required this.boneLoss,
    required this.attachmentLoss,
  });

  factory ForecastDataPoint.fromJson(Map<String, dynamic> json) {
    return ForecastDataPoint(
      month: json['month'] ?? 0,
      boneLoss: (json['bone_loss'] as num).toDouble(),
      attachmentLoss: (json['attachment_loss'] as num).toDouble(),
    );
  }
}

class ForecastResponse {
  final String riskCategory;
  final double riskProbability;
  final List<ForecastDataPoint> trajectory;

  ForecastResponse({
    required this.riskCategory,
    required this.riskProbability,
    required this.trajectory,
  });

  factory ForecastResponse.fromJson(Map<String, dynamic> json) {
    var trajList = json['trajectory'] as List? ?? [];
    List<ForecastDataPoint> traj = trajList.map((i) => ForecastDataPoint.fromJson(i)).toList();

    return ForecastResponse(
      riskCategory: json['risk_category'] ?? 'Stable',
      riskProbability: (json['risk_probability'] as num).toDouble(),
      trajectory: traj,
    );
  }
}

class ApiService {
  // Auth calls
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$apiBase/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      final detail = jsonDecode(response.body)['detail'] ?? 'Failed to login';
      throw Exception(detail);
    }
  }

  static Future<Map<String, dynamic>> signup(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$apiBase/api/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      final detail = jsonDecode(response.body)['detail'] ?? 'Failed to sign up';
      throw Exception(detail);
    }
  }

  static Future<Map<String, dynamic>> updateUser(String token, String name, String email, String? password) async {
    final Map<String, dynamic> body = {
      'name': name,
      'email': email,
    };
    if (password != null && password.trim().isNotEmpty) {
      body['password'] = password;
    }
    final response = await http.put(
      Uri.parse('$apiBase/api/auth/me'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      final detail = jsonDecode(response.body)['detail'] ?? 'Failed to update profile';
      throw Exception(detail);
    }
  }

  // Patients endpoints
  static Future<List<Patient>> getPatients(String token) async {
    final response = await http.get(
      Uri.parse('$apiBase/api/patients'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    if (response.statusCode == 200) {
      List<dynamic> body = jsonDecode(response.body);
      return body.map((dynamic item) => Patient.fromJson(item)).toList();
    } else {
      throw Exception('Failed to load patients');
    }
  }

  static Future<Patient> createPatient(String token, String name, int age, String gender, ClinicalRecord initialRecord) async {
    final response = await http.post(
      Uri.parse('$apiBase/api/patients'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'name': name,
        'age': age,
        'gender': gender,
        'initial_record': initialRecord.toJson(),
      }),
    );
    if (response.statusCode == 200) {
      return Patient.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create patient');
    }
  }

  static Future<Patient> addClinicalRecord(String token, String patientId, ClinicalRecord record) async {
    final response = await http.post(
      Uri.parse('$apiBase/api/patients/$patientId/records'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(record.toJson()),
    );
    if (response.statusCode == 200) {
      return Patient.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to add clinical record');
    }
  }

  static Future<ForecastResponse> getForecast({
    required bool smoking,
    required bool diabetes,
    required double hba1c,
    required double plaqueIndex,
    required double bleedingOnProbing,
    required double currentBoneLoss,
    required double currentAttachmentLoss,
  }) async {
    final response = await http.post(
      Uri.parse('$apiBase/api/forecast'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'smoking': smoking,
        'diabetes': diabetes,
        'hba1c': hba1c,
        'plaque_index': plaqueIndex,
        'bleeding_on_probing': bleedingOnProbing,
        'current_bone_loss': currentBoneLoss,
        'current_attachment_loss': currentAttachmentLoss,
      }),
    );
    if (response.statusCode == 200) {
      return ForecastResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to obtain forecast simulation');
    }
  }

  static Future<void> deletePatient(String token, String patientId) async {
    final response = await http.delete(
      Uri.parse('$apiBase/api/patients/$patientId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to delete patient');
    }
  }

  static Future<Patient> updatePatient(String token, String patientId, String name, int age, String gender) async {
    final response = await http.put(
      Uri.parse('$apiBase/api/patients/$patientId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'name': name,
        'age': age,
        'gender': gender,
      }),
    );
    if (response.statusCode == 200) {
      return Patient.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update patient details');
    }
  }
}
