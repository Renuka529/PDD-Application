import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_provider.dart';
import '../services/api_service.dart';
import 'patient_detail_page.dart';
import 'settings_page.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  List<Patient> _patients = [];
  List<Patient> _filteredPatients = [];
  bool _isLoading = true;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchPatients();
  }

  Future<void> _fetchPatients() async {
    setState(() => _isLoading = true);
    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token ?? '';
      final list = await ApiService.getPatients(token);
      setState(() {
        _patients = list;
        _filterPatients(_searchQuery);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load patient records: $e')),
        );
      }
    }
  }

  void _filterPatients(String query) {
    setState(() {
      _searchQuery = query;
      if (query.isEmpty) {
        _filteredPatients = _patients;
      } else {
        _filteredPatients = _patients
            .where((p) => p.name.toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  void _showAddPatientDialog() async {
    final prefs = await SharedPreferences.getInstance();
    final defaultGender = prefs.getString('pref_defaultGender') ?? 'Male';
    final defaultSmoking = prefs.getBool('pref_defaultSmoking') ?? false;

    final nameController = TextEditingController();
    final ageController = TextEditingController();
    String gender = defaultGender;
    bool smoking = defaultSmoking;
    bool diabetes = false;
    double hba1c = 5.5;
    double plaqueIndex = 30;
    double bop = 15;
    double boneLoss = 1.5;
    double attachLoss = 2.0;

    if (!mounted) return;
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: const Color(0xFF111827),
              title: const Text(
                'Add Patient Profile',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameController,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        labelStyle: TextStyle(color: Colors.grey),
                        enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: ageController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              labelText: 'Age',
                              labelStyle: TextStyle(color: Colors.grey),
                              enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: DropdownButton<String>(
                            value: gender,
                            dropdownColor: const Color(0xFF111827),
                            style: const TextStyle(color: Colors.white),
                            isExpanded: true,
                            underline: Container(height: 1, color: Colors.grey),
                            items: <String>['Male', 'Female', 'Other']
                                .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                                .toList(),
                            onChanged: (val) {
                              if (val != null) setStateDialog(() => gender = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Baseline Indicators',
                        style: TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold),
                      ),
                    ),
                    CheckboxListTile(
                      title: const Text('Active Smoker Status', style: TextStyle(color: Colors.white, fontSize: 14)),
                      value: smoking,
                      activeColor: const Color(0xFF38BDF8),
                      onChanged: (val) => setStateDialog(() => smoking = val ?? false),
                    ),
                    CheckboxListTile(
                      title: const Text('Diabetic Status', style: TextStyle(color: Colors.white, fontSize: 14)),
                      value: diabetes,
                      activeColor: const Color(0xFF38BDF8),
                      onChanged: (val) => setStateDialog(() => diabetes = val ?? false),
                    ),
                    if (diabetes) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('HbA1c Level (%)', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          Text('${hba1c.toStringAsFixed(1)}%', style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Slider(
                        value: hba1c,
                        min: 4.5,
                        max: 12.0,
                        activeColor: const Color(0xFF38BDF8),
                        onChanged: (val) => setStateDialog(() => hba1c = val),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Plaque Index: ${plaqueIndex.toInt()}%', style: const TextStyle(color: Colors.white, fontSize: 13)),
                      ],
                    ),
                    Slider(
                      value: plaqueIndex,
                      min: 0,
                      max: 100,
                      activeColor: const Color(0xFF38BDF8),
                      onChanged: (val) => setStateDialog(() => plaqueIndex = val),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Bleeding Index (BOP): ${bop.toInt()}%', style: const TextStyle(color: Colors.white, fontSize: 13)),
                      ],
                    ),
                    Slider(
                      value: bop,
                      min: 0,
                      max: 100,
                      activeColor: const Color(0xFF38BDF8),
                      onChanged: (val) => setStateDialog(() => bop = val),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            initialValue: boneLoss.toString(),
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(labelText: 'Bone Loss (mm)', labelStyle: TextStyle(color: Colors.grey)),
                            onChanged: (val) => boneLoss = double.tryParse(val) ?? 1.5,
                          ),
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: TextFormField(
                            initialValue: attachLoss.toString(),
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(labelText: 'Attachment Loss (mm)', labelStyle: TextStyle(color: Colors.grey)),
                            onChanged: (val) => attachLoss = double.tryParse(val) ?? 2.0,
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF38BDF8)),
                  onPressed: () async {
                    if (nameController.text.trim().isEmpty) return;
                    final initialRecord = ClinicalRecord(
                      timestamp: DateTime.now(),
                      smoking: smoking,
                      diabetes: diabetes,
                      hba1c: hba1c,
                      plaqueIndex: plaqueIndex,
                      bleedingOnProbing: bop,
                      boneLossAverage: boneLoss,
                      attachmentLossAverage: attachLoss,
                    );
                    final navigator = Navigator.of(context);
                    final messenger = ScaffoldMessenger.of(context);
                    try {
                      final token = Provider.of<AuthProvider>(context, listen: false).token ?? '';
                      final newPatient = await ApiService.createPatient(
                        token,
                        nameController.text,
                        int.tryParse(ageController.text) ?? 40,
                        gender,
                        initialRecord,
                      );
                      navigator.pop();
                      _fetchPatients();
                      messenger.showSnackBar(
                        SnackBar(content: Text('Created profile for ${newPatient.name}')),
                      );
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text('Error: $e')),
                      );
                    }
                  },
                  child: const Text('Save Profile', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _confirmDeletePatient(Patient patient) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF111827),
        title: const Text('Delete Profile', style: TextStyle(color: Colors.white)),
        content: Text('Are you sure you want to delete the clinical record for ${patient.name}?', style: const TextStyle(color: Colors.grey)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              try {
                final token = Provider.of<AuthProvider>(context, listen: false).token ?? '';
                await ApiService.deletePatient(token, patient.id);
                navigator.pop();
                _fetchPatients();
              } catch (e) {
                navigator.pop();
                messenger.showSnackBar(SnackBar(content: Text('Failed to delete profile: $e')));
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'PerioTwin™',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white),
            ),
            Text(
              'Dentist: ${context.watch<AuthProvider>().user?['name'] ?? 'Doctor'}',
              style: const TextStyle(fontSize: 12, color: Color(0xFF38BDF8)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _fetchPatients,
          ),
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsPage()),
              );
              setState(() {}); // Refresh dentist name or settings details
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () {
              context.read<AuthProvider>().logout();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF38BDF8),
        onPressed: _showAddPatientDialog,
        child: const Icon(Icons.add, color: Colors.black),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: _searchController,
              onChanged: _filterPatients,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search patients...',
                hintStyle: const TextStyle(color: Colors.grey),
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: const Color(0xFF111827),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
                : RefreshIndicator(
                    onRefresh: _fetchPatients,
                    color: const Color(0xFF38BDF8),
                    child: _filteredPatients.isEmpty
                        ? const Center(
                            child: Text('No patient records found', style: TextStyle(color: Colors.grey)),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            itemCount: _filteredPatients.length,
                            itemBuilder: (context, index) {
                              final p = _filteredPatients[index];
                              final latest = p.history.isNotEmpty ? p.history.last : null;
                              return Card(
                                color: const Color(0xFF111827),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: const BorderSide(color: Colors.white10),
                                ),
                                margin: const EdgeInsets.only(bottom: 10),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  title: Text(
                                    p.name,
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                  ),
                                  subtitle: Text(
                                    '${p.age} y/o • ${p.gender} | Bone Loss: ${latest?.boneLossAverage.toStringAsFixed(1)}mm',
                                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                                  ),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                    onPressed: () => _confirmDeletePatient(p),
                                  ),
                                  onTap: () async {
                                    final updated = await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => PatientDetailPage(patient: p),
                                      ),
                                    );
                                    if (updated == true) {
                                      _fetchPatients();
                                    }
                                  },
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
