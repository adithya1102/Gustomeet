import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../../core/utils/extensions.dart';
import '../../../data/models/terrace_model.dart';
import '../../../providers/wishlist_provider.dart';

class ListingCard extends ConsumerWidget {
  final TerraceModel terrace;
  final VoidCallback onTap;

  const ListingCard({super.key, required this.terrace, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rate = terrace.hourlyRate?.rate;
    final isWishlisted = ref.watch(wishlistProvider).contains(terrace.id);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? Colors.white : Colors.black;
    final shadowColor = isDark ? kGreen.withValues(alpha: 0.8) : Colors.black;

    final index = terrace.id.hashCode;
    final Color cardColor;
    if (isDark) {
      cardColor = context.kSurface;
    } else {
      final palette = [
        const Color(0xFF8CE1C2), // Teal/Mint from Phone 1
        const Color(0xFFFD7E60), // Salmon/Coral from Phone 1
        const Color(0xFFB9F172), // Chartreuse/Lime from Phone 2
        const Color(0xFFE9B3F4), // Lilac/Pink from Phone 2
        const Color(0xFF75E2FF), // Sky Blue from Phone 2
      ];
      cardColor = palette[index.abs() % palette.length];
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(24),
            topRight: Radius.circular(24),
            bottomLeft: Radius.circular(8),
            bottomRight: Radius.circular(8),
          ),
          border: Border.all(color: borderColor, width: 3),
          boxShadow: [
            BoxShadow(
              color: shadowColor,
              offset: const Offset(5, 5),
              blurRadius: 0,
              spreadRadius: 0,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: borderColor, width: 3)),
                  ),
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(21)),
                    child: terrace.coverPhoto != null
                        ? CachedNetworkImage(
                            imageUrl: terrace.coverPhoto!,
                            height: 160,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(
                                height: 160, color: context.kSurfaceHigh),
                            errorWidget: (_, __, ___) => Container(
                                height: 160,
                                color: context.kSurfaceHigh,
                                child: Icon(Icons.landscape_outlined,
                                    color: context.kTextSecondary, size: 40)),
                          )
                        : Container(
                            height: 160,
                            color: context.kSurfaceHigh,
                            child: Center(
                              child: Icon(Icons.landscape_outlined,
                                  color: context.kTextSecondary, size: 40),
                            ),
                          ),
                  ),
                ),
                // Wishlist heart
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: () {
                      ref.read(wishlistProvider.notifier).toggleWishlist(terrace.id);
                    },
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.black, width: 2),
                      ),
                      child: Icon(
                        isWishlisted ? Icons.favorite : Icons.favorite_border,
                        color: isWishlisted ? kError : Colors.black,
                        size: 16,
                      ),
                    ),
                  ),
                ),
                if (terrace.creatorReady)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: kPurple,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.black, width: 2),
                      ),
                      child: const Text('CREATOR READY',
                          style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                    ),
                  ),
              ],
            ),
            Container(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    terrace.title,
                    style: context.tsLabel.copyWith(fontWeight: FontWeight.w900),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined,
                          size: 11, color: context.kTextSecondary),
                      const SizedBox(width: 2),
                      Expanded(
                        child: Text(
                          terrace.area,
                          style: context.tsCaption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (rate != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: kGreen.withValues(alpha: 0.15),
                            border: Border.all(color: borderColor, width: 2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${rate.inr}/hr',
                            style: context.tsLabel.copyWith(color: kGreen, fontWeight: FontWeight.bold),
                          ),
                        ),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded,
                              size: 13, color: kWarning),
                          const SizedBox(width: 2),
                          Text('4.8',
                              style: context.tsCaption
                                  .copyWith(color: context.kTextPrimary, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
