import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class SearchBarWidget extends StatelessWidget {
  final VoidCallback onTap;

  const SearchBarWidget({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        decoration: BoxDecoration(
          color: context.kSurface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: context.kBorder),
        ),
        child: Row(
          children: [
            Icon(Icons.search, color: context.kTextSecondary, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text('Search terraces, lofts...',
                  style: context.tsBody),
            ),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: kGreen.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.tune_rounded, color: kGreen, size: 17),
            ),
          ],
        ),
      ),
    );
  }
}
