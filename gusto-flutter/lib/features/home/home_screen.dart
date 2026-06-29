import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../providers/auth_provider.dart';
import '../../data/models/terrace_model.dart';
import '../../providers/listings_provider.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import 'widgets/listing_card.dart';
import 'widgets/search_bar_widget.dart';
import 'widgets/filter_bottom_sheet.dart';

const _purposes = [
  ('All Places', null),
  ('Photography', 'PHOTOGRAPHY'),
  ('Reels', 'REELS_CONTENT'),
  ('Events', 'BIRTHDAY'),
  ('Games', 'SPORTS_GAMES'),
  ('Couples', 'COUPLE_DATE'),
  ('Dining', 'FOOD_DINING'),
  ('Other', 'OTHER'),
];

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final selectedPurpose = ref.watch(selectedPurposeProvider);
    final selectedCity = ref.watch(selectedCityProvider);
    final listingsAsync = ref.watch(listingsProvider(selectedPurpose));

    final firstName = user?.fullName?.split(' ').first ?? '';
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: CustomPaint(
        painter: GridBackgroundPainter(
          lineColor: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.04),
        ),
        child: RefreshIndicator(
          color: kGreen,
          backgroundColor: context.kSurface,
          onRefresh: () async => ref.invalidate(listingsProvider(selectedPurpose)),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // App Bar
              SliverAppBar(
              floating: true,
              snap: true,
              elevation: 0,
              backgroundColor: Colors.transparent,
              titleSpacing: 20,
              title: Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.black, width: 2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: Image.asset(
                        'assets/logo.png',
                        width: 28,
                        height: 28,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Gusto Meets',
                    style: GoogleFonts.syne(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined,
                      color: Colors.black, size: 22),
                  onPressed: () {},
                ),
                const SizedBox(width: 4),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(2),
                child: Container(height: 2, color: Colors.black),
              ),
            ),

            // Greeting + City Picker
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      firstName.isNotEmpty ? 'Hey, $firstName' : 'Gusto Meets',
                      style: GoogleFonts.syne(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        height: 1.0,
                        color: isDark ? Colors.white : Colors.black,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Push your booking today!',
                      style: GoogleFonts.lexend(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white60 : Colors.black54,
                      ),
                    ),
                    // City Picker Row
                    _CityPicker(
                      selectedCity: selectedCity,
                      onCityChanged: (city) {
                        ref.read(selectedCityProvider.notifier).state = city;
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: SearchBarWidget(
                  onTap: () => showModalBottomSheet(
                    context: context,
                    builder: (_) => const FilterBottomSheet(),
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                  ),
                ),
              ),
            ),

            // Filter Chips
            SliverToBoxAdapter(
              child: SizedBox(
                height: 50,
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                  scrollDirection: Axis.horizontal,
                  itemCount: _purposes.length + 1,
                  itemBuilder: (context, i) {
                    final isDark = Theme.of(context).brightness == Brightness.dark;
                    final borderColor = isDark ? Colors.white : Colors.black;

                    if (i == 0) {
                      return GestureDetector(
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            builder: (_) => const FilterBottomSheet(),
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                          );
                        },
                        child: Container(
                          width: 38,
                          height: 38,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.black : Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: borderColor, width: 2),
                          ),
                          child: Icon(Icons.tune_rounded, color: isDark ? Colors.white : Colors.black, size: 18),
                        ),
                      );
                    }

                    final p = _purposes[i - 1];
                    final isSelected = selectedPurpose == p.$2;

                    return GestureDetector(
                      onTap: () => ref
                          .read(selectedPurposeProvider.notifier)
                          .state = p.$2,
                      child: Container(
                        margin: const EdgeInsets.only(right: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? kGreen : (isDark ? Colors.black : Colors.white),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: borderColor, width: 2),
                        ),
                        child: Center(
                          child: Text(
                            p.$1,
                            style: GoogleFonts.lexend(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              color: isSelected ? Colors.black : (isDark ? Colors.white : Colors.black),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),

            // Available Locations Section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.map_rounded, size: 18, color: kGreen),
                        const SizedBox(width: 8),
                        Text('Available Locations', style: context.tsTitle),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Consumer(
                      builder: (context, ref, child) {
                        final availableCities = ref.watch(availableCitiesProvider);
                        
                        return SizedBox(
                          height: 38,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            separatorBuilder: (_, _) => const SizedBox(width: 8),
                            itemCount: availableCities.length + 1,
                            itemBuilder: (context, i) {
                              final isAll = i == 0;
                              final city = isAll ? null : availableCities[i - 1];
                              final displayName = isAll ? 'All Locations' : city!;
                              final isSelected = selectedCity == city;
                              
                              return GestureDetector(
                                onTap: () {
                                  ref.read(selectedCityProvider.notifier).state = city;
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? kGreen : context.kSurface,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                        color: isSelected ? kGreen : context.kBorder),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        isAll ? Icons.map_rounded : Icons.location_on_rounded,
                                        size: 14,
                                        color: isSelected ? kOnPrimary : (isAll ? context.kTextSecondary : kGreen),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        displayName,
                                        style: TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 13,
                                          fontWeight: isSelected
                                              ? FontWeight.w600
                                              : FontWeight.w400,
                                          color: isSelected
                                              ? kOnPrimary
                                              : context.kTextPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Grid section
            listingsAsync.when(
              loading: () => SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                sliver: SliverMasonryGrid.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childCount: 6,
                  itemBuilder: (_, _) => const ListingCardShimmer(),
                ),
              ),
              error: (e, _) => SliverFillRemaining(
                child: ErrorState(
                  message: 'Failed to load terraces',
                  onRetry: () => ref.invalidate(listingsProvider(selectedPurpose)),
                ),
              ),
              data: (listings) {
                if (listings.isEmpty) {
                  return SliverFillRemaining(
                    child: EmptyState(
                      message: selectedCity != null
                          ? 'No terraces in $selectedCity yet'
                          : 'No terraces found',
                    ),
                  );
                }

                // If a specific city is selected, show only that city's listings
                if (selectedCity != null) {
                  final cityListings = listings.where((t) => t.city == selectedCity).toList();
                  if (cityListings.isEmpty) {
                    return SliverFillRemaining(
                      child: EmptyState(
                        message: 'No terraces in $selectedCity yet',
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Terraces in $selectedCity', style: context.tsTitle),
                              Text(
                                '${cityListings.length} spaces',
                                style: context.tsCaption.copyWith(color: context.kTextSecondary),
                              ),
                            ],
                          ),
                        ),
                        MasonryGridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          itemCount: cityListings.length,
                          itemBuilder: (context, i) => ListingCard(
                            terrace: cityListings[i],
                            onTap: () => context.push('/listing/${cityListings[i].id}'),
                          ),
                        ),
                      ]),
                    ),
                  );
                }

                // If "All Locations" is selected, group by city
                final grouped = <String, List<TerraceModel>>{};
                for (final t in listings) {
                  grouped.putIfAbsent(t.city, () => []).add(t);
                }
                
                final sortedCities = grouped.keys.toList()..sort();

                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final city = sortedCities[index];
                        final cityListings = grouped[city]!;

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.location_on_rounded, size: 16, color: kGreen),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Terraces in $city',
                                          style: context.tsTitle.copyWith(fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      '${cityListings.length} spaces',
                                      style: context.tsCaption.copyWith(color: context.kTextSecondary),
                                    ),
                                  ],
                                ),
                              ),
                              MasonryGridView.count(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                crossAxisCount: 2,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                itemCount: cityListings.length,
                                itemBuilder: (context, i) => ListingCard(
                                  terrace: cityListings[i],
                                  onTap: () => context.push('/listing/${cityListings[i].id}'),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                      childCount: sortedCities.length,
                    ),
                  ),
                );
              },
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    ),
    floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/host/onboarding'),
        backgroundColor: kGreen,
        foregroundColor: kOnPrimary,
        elevation: 4,
        child: const Icon(Icons.add_rounded, size: 28),
      ),
    );
  }
}

// ─── City Picker ─────────────────────────────────────────────────────────────

class _CityPicker extends StatelessWidget {
  final String? selectedCity;
  final ValueChanged<String?> onCityChanged;

  const _CityPicker({
    required this.selectedCity,
    required this.onCityChanged,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showCitySheet(context),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.location_on_rounded, size: 14, color: kGreen),
          const SizedBox(width: 4),
          Text(
            selectedCity ?? 'All Locations',
            style: context.tsCaption.copyWith(
              color: kGreen,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 2),
          const Icon(Icons.keyboard_arrow_down_rounded,
              size: 16, color: kGreen),
        ],
      ),
    );
  }

  void _showCitySheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _CitySheet(
        selectedCity: selectedCity,
        onCitySelected: (city) {
          Navigator.of(context).pop();
          onCityChanged(city);
        },
      ),
    );
  }
}

class _CitySheet extends ConsumerWidget {
  final String? selectedCity;
  final ValueChanged<String?> onCitySelected;

  const _CitySheet({
    required this.selectedCity,
    required this.onCitySelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final availableCities = ref.watch(availableCitiesProvider);
    final displayItems = [
      (null, 'All Locations'),
      ...availableCities.map((c) => (c, c)),
    ];

    return Container(
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: context.kBorder)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: context.kBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Row(
                  children: [
                    const Icon(Icons.location_city_rounded,
                        size: 18, color: kGreen),
                    const SizedBox(width: 8),
                    Text('Select City', style: context.tsTitle),
                  ],
                ),
              ),
              const Divider(height: 1),
              ...displayItems.map((c) {
                final isSelected = c.$1 == selectedCity;
                return InkWell(
                  onTap: () => onCitySelected(c.$1),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? kGreen.withValues(alpha: 0.08)
                          : Colors.transparent,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? kGreen.withValues(alpha: 0.15)
                                : context.kBg,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected
                                  ? kGreen.withValues(alpha: 0.4)
                                  : context.kBorder,
                            ),
                          ),
                          child: Icon(
                            c.$1 == null ? Icons.map_rounded : Icons.location_on_rounded,
                            size: 16,
                            color: isSelected ? kGreen : context.kTextSecondary,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            c.$2,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: isSelected
                                  ? kGreen
                                  : context.kTextPrimary,
                            ),
                          ),
                        ),
                        if (isSelected)
                          const Icon(Icons.check_circle_rounded,
                              size: 18, color: kGreen),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class GridBackgroundPainter extends CustomPainter {
  final Color lineColor;
  GridBackgroundPainter({required this.lineColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = lineColor
      ..strokeWidth = 1.0;

    const double step = 32.0;

    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
