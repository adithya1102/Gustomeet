import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/extensions.dart';
import '../../data/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/app_bar_widget.dart';
import '../../shared/widgets/primary_button.dart';

class HostDashboardScreen extends ConsumerStatefulWidget {
  const HostDashboardScreen({super.key});

  @override
  ConsumerState<HostDashboardScreen> createState() => _HostDashboardScreenState();
}

class _HostDashboardScreenState extends ConsumerState<HostDashboardScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _listings = [];
  List<Map<String, dynamic>> _bookings = [];
  double _totalEarnings = 0.0;

  @override
  void initState() {
    super.initState();
    _loadHostData();
  }

  Future<void> _loadHostData() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);
    try {
      // 1. Fetch Host's Terraces
      final listingsData = await supabase
          .from('terraces')
          .select('*, terrace_rates(*)')
          .eq('host_id', user.id);
      
      final listingsList = List<Map<String, dynamic>>.from(listingsData as List);

      // 2. Fetch Bookings for those Terraces
      final terraceIds = listingsList.map((t) => t['id'] as String).toList();
      
      List<Map<String, dynamic>> bookingsList = [];
      if (terraceIds.isNotEmpty) {
        final bookingsData = await supabase
            .from('bookings')
            .select('*, guest:users(full_name, profile_photo_url), terrace:terraces(title)')
            .inFilter('terrace_id', terraceIds)
            .order('start_time', ascending: false);
        
        bookingsList = List<Map<String, dynamic>>.from(bookingsData as List);
      }

      // Calculate earnings from confirmed bookings
      double earnings = 0.0;
      for (var b in bookingsList) {
        if (b['status'] == 'CONFIRMED') {
          // Earnings are subtotal minus platform fees (or we can just sum total charged)
          earnings += (b['total_charged'] as num?)?.toDouble() ?? 0.0;
        }
      }

      setState(() {
        _listings = listingsList;
        _bookings = bookingsList;
        _totalEarnings = earnings;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading host dashboard: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.kBg,
      appBar: const AppBarWidget(title: 'Host Dashboard'),
      body: RefreshIndicator(
        onRefresh: _loadHostData,
        color: kGreen,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: kGreen))
            : ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildEarningsCard(),
                  const SizedBox(height: 24),
                  _buildAddListingButton(context),
                  const SizedBox(height: 28),
                  _buildListingsSection(),
                  const SizedBox(height: 28),
                  _buildBookingsSection(),
                ],
              ),
      ),
    );
  }

  Widget _buildEarningsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [kGreen, Color(0xFF1B4D3E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: kGreen.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.show_chart_rounded, color: Colors.white, size: 22),
              const SizedBox(width: 8),
              Text(
                'Total Revenue',
                style: context.tsCaption.copyWith(color: Colors.white70, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _totalEarnings.toInt().inr,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'From ${_bookings.length} confirmed bookings',
            style: context.tsCaption.copyWith(color: Colors.white60),
          ),
        ],
      ),
    );
  }

  Widget _buildAddListingButton(BuildContext context) {
    return PrimaryButton(
      label: 'List Another Terrace',
      color: kGreen,
      onPressed: () => context.push('/host/onboarding'),
    );
  }

  Widget _buildListingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('My Terraces', style: context.tsTitle),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: context.kSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.kBorder),
              ),
              child: Text(
                '${_listings.length} active',
                style: context.tsCaption.copyWith(color: kGreen, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_listings.isEmpty)
          _buildEmptyState('No listings added yet. Start hosting today!')
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _listings.length,
            itemBuilder: (context, index) {
              final listing = _listings[index];
              final rate = (listing['terrace_rates'] as List?)?.firstOrNull;
              final rateValue = (rate?['rate'] as num?)?.toDouble() ?? 0.0;
              final photo = (listing['photos'] as List?)?.firstOrNull as String?;

              return Card(
                color: context.kSurface,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: context.kBorder),
                ),
                elevation: 0,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: photo != null
                            ? Image.network(photo, width: 64, height: 64, fit: BoxFit.cover)
                            : Container(
                                width: 64,
                                height: 64,
                                color: context.kBorder,
                                child: Icon(Icons.landscape_outlined, color: context.kTextSecondary),
                              ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              listing['title'] as String? ?? 'My Terrace',
                              style: context.tsBodyPrimary.copyWith(fontWeight: FontWeight.bold),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${listing['area']} · Up to ${listing['max_capacity']} guests',
                              style: context.tsCaption,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${rateValue.toInt().inr}/hr',
                              style: context.tsBodyPrimary.copyWith(color: kGreen, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: kGreen.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'VERIFIED',
                              style: TextStyle(color: kGreen, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildBookingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recent Terrace Bookings', style: context.tsTitle),
        const SizedBox(height: 12),
        if (_bookings.isEmpty)
          _buildEmptyState('No guest bookings received yet.')
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _bookings.length,
            itemBuilder: (context, index) {
              final booking = _bookings[index];
              final guest = booking['guest'] as Map<String, dynamic>?;
              final terrace = booking['terrace'] as Map<String, dynamic>?;
              final start = DateTime.parse(booking['start_time'] as String);
              final total = (booking['total_charged'] as num?)?.toDouble() ?? 0.0;
              final guestPhoto = guest?['profile_photo_url'] as String?;

              return Card(
                color: context.kSurface,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: context.kBorder),
                ),
                elevation: 0,
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  leading: CircleAvatar(
                    backgroundColor: kGreen.withValues(alpha: 0.1),
                    backgroundImage: guestPhoto != null ? NetworkImage(guestPhoto) : null,
                    child: guestPhoto == null
                        ? const Icon(Icons.person, color: kGreen)
                        : null,
                  ),
                  title: Text(
                    guest?['full_name'] as String? ?? 'Guest User',
                    style: context.tsBodyPrimary.copyWith(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text('Space: ${terrace?['title'] ?? 'Terrace'}', style: context.tsCaption),
                      const SizedBox(height: 2),
                      Text(
                        'Time: ${start.toString().substring(0, 16)}',
                        style: context.tsCaption,
                      ),
                    ],
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        total.toInt().inr,
                        style: context.tsBodyPrimary.copyWith(fontWeight: FontWeight.bold, color: kGreen),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        booking['status'] as String? ?? 'CONFIRMED',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: booking['status'] == 'CONFIRMED' ? kGreen : kError,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: context.kSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.kBorder),
      ),
      child: Center(
        child: Text(
          message,
          style: context.tsBody.copyWith(color: context.kTextSecondary),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
