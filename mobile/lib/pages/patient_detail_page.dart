import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../services/api_service.dart';

class PatientDetailPage extends StatefulWidget {
  final Patient patient;
  const PatientDetailPage({super.key, required this.patient});

  @override
  State<PatientDetailPage> createState() => _PatientDetailPageState();
}

class _PatientDetailPageState extends State<PatientDetailPage> {
  late Patient _currentPatient;
  late ClinicalRecord _latestRecord;

  // Simulator state variables
  bool _smoking = false;
  bool _diabetes = false;
  double _hba1c = 5.5;
  double _plaqueIndex = 30.0;
  double _bop = 15.0;

  // Simulation outputs
  ForecastResponse? _forecast;
  bool _isSavingRecord = false;
  bool _hasChanged = false;

  @override
  void initState() {
    super.initState();
    _currentPatient = widget.patient;
    _latestRecord = _currentPatient.history.last;
    _resetToBaseline();
  }

  void _showEditPatientDialog() {
    final nameController = TextEditingController(text: _currentPatient.name);
    final ageController = TextEditingController(text: _currentPatient.age.toString());
    String gender = _currentPatient.gender;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: const Color(0xFF111827),
              title: const Text(
                'Edit Patient Demographics',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              content: Column(
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
                ],
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
                    final navigator = Navigator.of(context);
                    final messenger = ScaffoldMessenger.of(context);
                    try {
                      final token = Provider.of<AuthProvider>(context, listen: false).token ?? '';
                      final updated = await ApiService.updatePatient(
                        token,
                        _currentPatient.id,
                        nameController.text.trim(),
                        int.tryParse(ageController.text) ?? _currentPatient.age,
                        gender,
                      );
                      navigator.pop();
                      setState(() {
                        _currentPatient = updated;
                        _hasChanged = true;
                      });
                      messenger.showSnackBar(
                        const SnackBar(content: Text('Patient updated successfully.')),
                      );
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text('Failed to update patient: $e')),
                      );
                    }
                  },
                  child: const Text('Save Changes', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _resetToBaseline() {
    setState(() {
      _smoking = _latestRecord.smoking;
      _diabetes = _latestRecord.diabetes;
      _hba1c = _latestRecord.hba1c;
      _plaqueIndex = _latestRecord.plaqueIndex;
      _bop = _latestRecord.bleedingOnProbing;
    });
    _runSimulation();
  }

  Future<void> _runSimulation() async {
    try {
      final serverResult = await ApiService.getForecast(
        smoking: _smoking,
        diabetes: _diabetes,
        hba1c: _hba1c,
        plaqueIndex: _plaqueIndex,
        bleedingOnProbing: _bop,
        currentBoneLoss: _latestRecord.boneLossAverage,
        currentAttachmentLoss: _latestRecord.attachmentLossAverage,
      );
      setState(() {
        _forecast = serverResult;
      });
    } catch (e) {
      debugPrint("Failed to get forecast: $e");
    }
  }

  Future<void> _saveSimulationAsNewRecord() async {
    setState(() => _isSavingRecord = true);
    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token ?? '';
      final updatedPatient = await ApiService.addClinicalRecord(
        token,
        _currentPatient.id,
        ClinicalRecord(
          timestamp: DateTime.now(),
          smoking: _smoking,
          diabetes: _diabetes,
          hba1c: _hba1c,
          plaqueIndex: _plaqueIndex,
          bleedingOnProbing: _bop,
          boneLossAverage: _latestRecord.boneLossAverage,
          attachmentLossAverage: _latestRecord.attachmentLossAverage,
        ),
      );
      setState(() {
        _currentPatient = updatedPatient;
        _latestRecord = _currentPatient.history.last;
        _isSavingRecord = false;
        _hasChanged = true;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saved simulation as a new history record.')),
        );
      }
    } catch (e) {
      setState(() => _isSavingRecord = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save record to server: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Collect spots for graph plotting
    List<FlSpot> boneLossSpots = [];
    List<FlSpot> attachLossSpots = [];
    double maxVal = 5.0;

    if (_forecast != null) {
      for (var pt in _forecast!.trajectory) {
        boneLossSpots.add(FlSpot(pt.month.toDouble(), pt.boneLoss));
        attachLossSpots.add(FlSpot(pt.month.toDouble(), pt.attachmentLoss));
        if (pt.boneLoss > maxVal) maxVal = pt.boneLoss;
        if (pt.attachmentLoss > maxVal) maxVal = pt.attachmentLoss;
      }
    }

    final hasImproved = _plaqueIndex < _latestRecord.plaqueIndex ||
        _bop < _latestRecord.bleedingOnProbing ||
        (_latestRecord.smoking && !_smoking);

    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context, _hasChanged),
        ),
        title: Text(
          _currentPatient.name,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_note),
            tooltip: 'Edit Patient Demographics',
            onPressed: _showEditPatientDialog,
          ),
          IconButton(
            icon: const Icon(Icons.restore),
            tooltip: 'Reset sliders to baseline',
            onPressed: _resetToBaseline,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Demographic Card
            Card(
              color: const Color(0xFF111827),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Colors.white10),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _currentPatient.name,
                              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Age: ${_currentPatient.age}  |  Gender: ${_currentPatient.gender}',
                              style: const TextStyle(color: Colors.grey, fontSize: 13),
                            ),
                          ],
                        ),
                        if (_forecast != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _forecast!.riskCategory == 'Stable'
                                  ? const Color(0xFF34D399).withAlpha(38)
                                  : const Color(0xFFF87171).withAlpha(38),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _forecast!.riskCategory == 'Stable'
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFFF87171),
                              ),
                            ),
                            child: Text(
                              '${_forecast!.riskCategory} (${(_forecast!.riskProbability * 100).toInt()}%)',
                              style: TextStyle(
                                color: _forecast!.riskCategory == 'Stable'
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFFF87171),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Line Chart Segment
            const Text(
              'Disease Trajectory Projection',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Card(
              color: const Color(0xFF111827),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    SizedBox(
                      height: 250,
                      child: boneLossSpots.isEmpty
                          ? const Center(child: CircularProgressIndicator())
                          : LineChart(
                              LineChartData(
                                gridData: const FlGridData(
                                  show: true,
                                  drawVerticalLine: true,
                                  horizontalInterval: 1.0,
                                  verticalInterval: 3.0,
                                ),
                                titlesData: FlTitlesData(
                                  show: true,
                                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  bottomTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      reservedSize: 30,
                                      interval: 6,
                                      getTitlesWidget: (value, meta) {
                                        if (value == 0) return const Text('Base', style: TextStyle(color: Colors.grey, fontSize: 11));
                                        if (value == 6) return const Text('6m', style: TextStyle(color: Colors.grey, fontSize: 11));
                                        if (value == 12) return const Text('12m', style: TextStyle(color: Colors.grey, fontSize: 11));
                                        return const Text('');
                                      },
                                    ),
                                  ),
                                  leftTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      reservedSize: 42,
                                      getTitlesWidget: (value, meta) {
                                        return Text(
                                          '${value.toStringAsFixed(1)}mm',
                                          style: const TextStyle(color: Colors.grey, fontSize: 10),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                                borderData: FlBorderData(
                                  show: true,
                                  border: Border.all(color: Colors.white12, width: 1),
                                ),
                                minX: 0,
                                maxX: 12,
                                minY: 0,
                                maxY: maxVal + 0.5,
                                lineBarsData: [
                                  LineChartBarData(
                                    spots: boneLossSpots,
                                    isCurved: true,
                                    color: const Color(0xFF38BDF8),
                                    barWidth: 3,
                                    isStrokeCapRound: true,
                                    dotData: const FlDotData(show: true),
                                    belowBarData: BarAreaData(show: false),
                                  ),
                                  LineChartBarData(
                                    spots: attachLossSpots,
                                    isCurved: true,
                                    color: const Color(0xFFA78BFA),
                                    barWidth: 3,
                                    isStrokeCapRound: true,
                                    dotData: const FlDotData(show: true),
                                    belowBarData: BarAreaData(show: false),
                                  ),
                                ],
                              ),
                            ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(width: 12, height: 12, decoration: const BoxDecoration(color: Color(0xFF38BDF8), shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        const Text('Bone Loss Avg (mm)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(width: 20),
                        Container(width: 12, height: 12, decoration: const BoxDecoration(color: Color(0xFFA78BFA), shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        const Text('Attachment Loss (mm)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Simulation Message
            if (_forecast != null) ...[
              Card(
                color: _forecast!.riskCategory == 'Stable'
                    ? const Color(0xFF34D399).withAlpha(20)
                    : const Color(0xFFF87171).withAlpha(20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: _forecast!.riskCategory == 'Stable'
                        ? const Color(0xFF34D399).withAlpha(76)
                        : const Color(0xFFF87171).withAlpha(76),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    children: [
                      Icon(
                        _forecast!.riskCategory == 'Stable' ? Icons.check_circle_outline : Icons.warning_amber_rounded,
                        color: _forecast!.riskCategory == 'Stable' ? const Color(0xFF34D399) : const Color(0xFFF87171),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _forecast!.riskCategory == 'Stable'
                              ? 'Simulation Status: Controlled. Prognosis indicates minor bone loss changes. Maintain current oral hygiene.'
                              : 'Simulation Warning: High progression score. Bone degradation is predicted to accelerate. Lifestyle or clinical adjustments are required.',
                          style: TextStyle(
                            color: _forecast!.riskCategory == 'Stable' ? const Color(0xFF34D399) : const Color(0xFFF87171),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (hasImproved) ...[
                const SizedBox(height: 6),
                const Row(
                  children: [
                    Icon(Icons.star, color: Colors.greenAccent, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'Simulation shows active improvement over baseline!',
                      style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 16),
            ],

            // Sliders Section
            const Text(
              'Digital Twin Controls (Adjust to Simulate)',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                children: [
                  // Smoking switch
                  SwitchListTile(
                    title: const Text('Smoking Status', style: TextStyle(color: Colors.white)),
                    subtitle: Text(_smoking ? 'Smoker' : 'Cessation / Non-Smoker', style: const TextStyle(color: Colors.grey)),
                    value: _smoking,
                    onChanged: (val) {
                      setState(() => _smoking = val);
                      _runSimulation();
                    },
                  ),
                  const Divider(color: Colors.white10),

                  // Diabetes switch
                  SwitchListTile(
                    title: const Text('Diabetic Status', style: TextStyle(color: Colors.white)),
                    subtitle: Text(_diabetes ? 'Diabetic' : 'Non-Diabetic', style: const TextStyle(color: Colors.grey)),
                    value: _diabetes,
                    onChanged: (val) {
                      setState(() => _diabetes = val);
                      _runSimulation();
                    },
                  ),
                  if (_diabetes) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('  HbA1c level', style: TextStyle(color: Colors.white70)),
                        Text('${_hba1c.toStringAsFixed(1)}%', style: const TextStyle(color: Color(0xFF38BDF8))),
                      ],
                    ),
                    Slider(
                      value: _hba1c,
                      min: 4.5,
                      max: 12.0,
                      activeColor: const Color(0xFF38BDF8),
                      onChanged: (val) {
                        setState(() => _hba1c = val);
                      },
                      onChangeEnd: (val) => _runSimulation(),
                    ),
                  ],
                  const Divider(color: Colors.white10),

                  // Plaque Index
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Plaque Index', style: TextStyle(color: Colors.white)),
                      Text('${_plaqueIndex.toInt()}%', style: const TextStyle(color: Color(0xFF38BDF8))),
                    ],
                  ),
                  Slider(
                    value: _plaqueIndex,
                    min: 0,
                    max: 100,
                    activeColor: const Color(0xFF38BDF8),
                    onChanged: (val) {
                      setState(() => _plaqueIndex = val);
                    },
                    onChangeEnd: (val) => _runSimulation(),
                  ),
                  const Divider(color: Colors.white10),

                  // BOP Index
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Bleeding on Probing (BOP)', style: TextStyle(color: Colors.white)),
                      Text('${_bop.toInt()}%', style: const TextStyle(color: Color(0xFF38BDF8))),
                    ],
                  ),
                  Slider(
                    value: _bop,
                    min: 0,
                    max: 100,
                    activeColor: const Color(0xFF38BDF8),
                    onChanged: (val) {
                      setState(() => _bop = val);
                    },
                    onChangeEnd: (val) => _runSimulation(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Save Simulation Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF38BDF8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isSavingRecord ? null : _saveSimulationAsNewRecord,
                child: _isSavingRecord
                    ? const CircularProgressIndicator(color: Colors.black)
                    : const Text(
                        'Save Simulation to Record History',
                        style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
