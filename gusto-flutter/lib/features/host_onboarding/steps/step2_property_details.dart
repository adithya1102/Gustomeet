import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/host_provider.dart';
import '../../../shared/widgets/primary_button.dart';

const _areas = [
  'Nanganallur', 'Adambakkam', 'Chromepet', 'Pammal',
  'Pallikaranai', 'Velachery', 'Perungudi', 'Medavakkam',
  'Tambaram', 'West Mambalam', 'T Nagar', 'Mylapore', 'Other'
];

const _floors = ['Ground', '1st', '2nd', '3rd', '4th', 'Higher'];
const _floorValues = [0, 1, 2, 3, 4, 5];
const _directions = [('N', 'NORTH'), ('S', 'SOUTH'), ('E', 'EAST'), ('W', 'WEST')];
const _sizes = ['<300 sqft', '300-500', '500-800', '800+'];

class Step2PropertyDetails extends ConsumerWidget {
  final VoidCallback onNext;
  const Step2PropertyDetails({super.key, required this.onNext});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(hostOnboardingProvider);
    final notifier = ref.read(hostOnboardingProvider.notifier);

    bool canProceed = state.area.isNotEmpty && state.addressLine.isNotEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Property Details', style: context.tsHeadline),
          const SizedBox(height: 4),
          Text('Tell us about your terrace location', style: context.tsBody),
          const SizedBox(height: 24),
          Text('City', style: context.tsLabel),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              border: Border.all(color: context.kBorder),
              borderRadius: BorderRadius.circular(8),
              color: context.kSurface,
            ),
            child: Row(
              children: [
                Icon(Icons.location_city_outlined,
                    color: context.kTextSecondary, size: 18),
                const SizedBox(width: 8),
                Text('Chennai', style: context.tsBodyPrimary),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text('Area', style: context.tsLabel),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: state.area.isEmpty ? null : state.area,
            hint: Text('Select area', style: context.tsBody),
            decoration: const InputDecoration(),
            items: _areas
                .map((a) => DropdownMenuItem(value: a, child: Text(a)))
                .toList(),
            onChanged: (v) =>
                notifier.update((s) => s.copyWith(area: v ?? '')),
          ),
          const SizedBox(height: 16),
          Text('Address', style: context.tsLabel),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: state.addressLine,
            decoration: const InputDecoration(
                hintText: 'Door no., street, landmark'),
            onChanged: (v) =>
                notifier.update((s) => s.copyWith(addressLine: v)),
          ),
          const SizedBox(height: 16),
          Text('Floor level', style: context.tsLabel),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(
              _floors.length,
              (i) {
                final isSelected = state.floorLevel == _floorValues[i];
                return GestureDetector(
                  onTap: () => notifier.update(
                      (s) => s.copyWith(floorLevel: _floorValues[i])),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? kGreen.withValues(alpha: 0.1)
                          : context.kSurface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: isSelected ? kGreen : context.kBorder),
                    ),
                    child: Text(
                      _floors[i],
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isSelected
                            ? FontWeight.w600
                            : FontWeight.normal,
                        color: isSelected ? kGreen : context.kTextPrimary,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          Text('Terrace direction', style: context.tsLabel),
          const SizedBox(height: 10),
          Row(
            children: _directions.map((d) {
              final isSelected = state.terraceDirection == d.$2;
              return Expanded(
                child: GestureDetector(
                  onTap: () => notifier
                      .update((s) => s.copyWith(terraceDirection: d.$2)),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? kGreen.withValues(alpha: 0.1)
                          : context.kSurface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: isSelected ? kGreen : context.kBorder),
                    ),
                    child: Column(
                      children: [
                        Text(
                          d.$1,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color:
                                isSelected ? kGreen : context.kTextPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Text('Size', style: context.tsLabel),
          const SizedBox(height: 10),
          SegmentedButton<String>(
            segments: _sizes
                .map((s) => ButtonSegment(value: s, label: Text(s)))
                .toList(),
            selected: {state.sizeCategory},
            onSelectionChanged: (sel) => notifier
                .update((s) => s.copyWith(sizeCategory: sel.first)),
          ),
          const SizedBox(height: 16),
          Text('Max capacity', style: context.tsLabel),
          const SizedBox(height: 10),
          Row(
            children: [
              IconButton(
                onPressed: state.maxCapacity > 2
                    ? () => notifier.update(
                        (s) => s.copyWith(maxCapacity: s.maxCapacity - 2))
                    : null,
                icon: const Icon(Icons.remove_circle_outline),
                color: kGreen,
              ),
              Text('${state.maxCapacity} people',
                  style: context.tsBodyPrimary),
              IconButton(
                onPressed: state.maxCapacity < 50
                    ? () => notifier.update(
                        (s) => s.copyWith(maxCapacity: s.maxCapacity + 2))
                    : null,
                icon: const Icon(Icons.add_circle_outline),
                color: kGreen,
              ),
            ],
          ),
          const SizedBox(height: 32),
          PrimaryButton(
            label: 'Continue',
            onPressed: canProceed ? onNext : null,
          ),
        ],
      ),
    );
  }
}
