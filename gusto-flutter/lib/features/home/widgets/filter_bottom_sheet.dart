import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../providers/listings_provider.dart';
import '../../../shared/widgets/primary_button.dart';

const _purposes = [
  ('All', null),
  ('Photography', 'PHOTOGRAPHY'),
  ('Reels', 'REELS_CONTENT'),
  ('Events', 'BIRTHDAY'),
  ('Games', 'SPORTS_GAMES'),
  ('Couples', 'COUPLE_DATE'),
  ('Dining', 'FOOD_DINING'),
  ('Other', 'OTHER'),
];

class FilterBottomSheet extends ConsumerWidget {
  const FilterBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedPurposeProvider);

    return Container(
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                  color: context.kBorder,
                  borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 20),
          Text('Filter by purpose', style: context.tsTitle),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _purposes.map((p) {
              final isSelected = selected == p.$2;
              return GestureDetector(
                onTap: () =>
                    ref.read(selectedPurposeProvider.notifier).state = p.$2,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: isSelected ? kGreen : context.kSurface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: isSelected ? kGreen : context.kBorder),
                  ),
                  child: Text(
                    p.$1,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.w400,
                      color: isSelected
                          ? kOnPrimary
                          : context.kTextSecondary,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 28),
          PrimaryButton(
            label: 'Apply',
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}
