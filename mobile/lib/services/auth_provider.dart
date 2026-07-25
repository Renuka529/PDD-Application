import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  bool _hasSeenOnboarding = false;

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  bool get hasSeenOnboarding => _hasSeenOnboarding;

  AuthProvider() {
    checkLogin();
  }

  Future<void> checkLogin() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _hasSeenOnboarding = prefs.getBool('has_seen_onboarding') ?? false;
      _token = prefs.getString('token');
      
      final userJson = prefs.getString('user');
      if (userJson != null) {
        _user = jsonDecode(userJson) as Map<String, dynamic>;
      } else {
        _token = null; // Ensure token is null if user data is missing
      }
    } catch (e) {
      debugPrint('Error loading auth credentials: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> setOnboardingSeen() async {
    _hasSeenOnboarding = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', true);
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    bool success = false;

    try {
      final result = await ApiService.login(email, password);
      _token = result['token'];
      _user = result['user'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('user', jsonEncode(_user));
      success = true;
    } catch (e) {
      debugPrint('Login failed: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return success;
  }

  Future<bool> signup(String name, String email, String password) async {
    _isLoading = true;
    notifyListeners();
    bool success = false;

    try {
      final result = await ApiService.signup(name, email, password);
      _token = result['token'];
      _user = result['user'];

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('user', jsonEncode(_user));
      success = true;
    } catch (e) {
      debugPrint('Signup failed: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return success;
  }

  Future<void> updateUserData(Map<String, dynamic> updatedUser) async {
    _user = updatedUser;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', jsonEncode(_user));
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    notifyListeners();
  }
}
