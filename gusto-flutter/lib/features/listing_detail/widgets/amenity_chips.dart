import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/terrace_model.dart';

class AmenityChips extends StatelessWidget {
  final TerraceModel terrace;

  const AmenityChips({super.key, required this.terrace});

  @override
  Widget build(BuildContext context) {
    final items = <String>[];

    if (terrace.permissions?.allowCouples == true) items.add('Couples OK');
    if (terrace.permissions?.allowOutsideFood == true) items.add('Outside food');
    if (terrace.permissions?.allowLoudMusic == true) items.add('Music OK');
    if (terrace.noiseEnvironment != null) {
      items.add(terrace.noiseEnvironment!.toLowerCase().replaceAll('_', ' ').capitalize);
    }
    items.addAll(
      terrace.permissions?.allowedPurposes
              .map((p) => p.replaceAll('_', ' ').capitalize) ??
          [],
    );

    if (items.isEmpty) return const SizedBox.shrink();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: items.map((tag) => _Chip(label: tag)).toList(),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  const _Chip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: context.kBg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: context.kBorder),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 12, color: context.kTextSecondary)),
    );
  }
}

extension on String {
  String get capitalize => isEmpty
      ? this
      : '${this[0].toUpperCase()}${substring(1).toLowerCase()}';
}
