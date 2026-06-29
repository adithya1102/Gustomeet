import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../data/models/terrace_model.dart';

class LightWindowCard extends StatelessWidget {
  final TerraceLightDataModel lightData;

  const LightWindowCard({super.key, required this.lightData});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color.fromRGBO(245, 158, 11, 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color.fromRGBO(245, 158, 11, 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.wb_sunny_outlined,
                  color: kWarning, size: 20),
              const SizedBox(width: 8),
              Text('Why creators love this spot',
                  style: AppTextStyles.labelMedium),
            ],
          ),
          const SizedBox(height: 10),
          if (lightData.goldenHourStart != null) ...[
            _Row(
              icon: Icons.sunny,
              label:
                  'Golden hour: ${lightData.goldenHourStart}–${lightData.goldenHourEnd}',
            ),
            const SizedBox(height: 6),
          ],
          if (lightData.bestShootPeriod != null)
            _Row(
              icon: Icons.camera_alt_outlined,
              label: lightData.bestShootPeriod!,
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon;
  final String label;

  const _Row({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: kWarning),
        const SizedBox(width: 8),
        Expanded(
            child: Text(label, style: AppTextStyles.body)),
      ],
    );
  }
}
