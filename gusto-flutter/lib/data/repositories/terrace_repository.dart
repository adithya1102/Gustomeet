import 'package:flutter/foundation.dart';
import '../models/terrace_model.dart';
import '../models/review_model.dart';
import '../supabase_client.dart';

class TerraceRepository {
  static const _selectFull = '''
    *,
    terrace_rates(*),
    terrace_permissions(*),
    terrace_light_data(*)
  ''';

  Future<List<TerraceModel>> getListings({
    String? purpose,
    int page = 0,
    int pageSize = 12,
  }) async {
    try {
      // Simplified query — no filters — to isolate connectivity issues
      final data = await supabase
          .from('terraces')
          .select(_selectFull)
          .limit(100); // Fetch a larger limit to get all available locations and terraces

      debugPrint('✅ getListings raw: ${(data as List).length} terraces');
      for (final t in data) {
        debugPrint('  > ${t['title']} | is_active=${t['is_active']} | verification=${t['verification']} | city=${t['city']}');
      }

      // Filter client-side
      final listings = (data as List)
          .map((e) => TerraceModel.fromMap(e as Map<String, dynamic>))
          .where((t) => t.isActive && t.verification == 'VERIFIED');

      if (purpose != null) {
        return listings
            .where((t) => t.permissions?.allowedPurposes.contains(purpose) == true)
            .toList();
      }

      return listings.toList();
    } catch (e, st) {
      debugPrint('❌ getListings ERROR: $e');
      debugPrint(st.toString());
      rethrow;
    }
  }

  Future<TerraceModel> getTerrace(String id) async {
    final data = await supabase
        .from('terraces')
        .select(_selectFull)
        .eq('id', id)
        .single();
    return TerraceModel.fromMap(data);
  }

  Future<List<ReviewModel>> getReviews(String terraceId) async {
    // Query reviews directly via a join on bookings.terrace_id.
    // This avoids a separate bookings query (which is auth-restricted).
    final reviews = await supabase
        .from('reviews')
        .select('*, reviewer:reviewer_id(full_name, profile_photo_url), booking:booking_id(terrace_id)')
        .eq('booking.terrace_id', terraceId)
        .order('created_at', ascending: false)
        .limit(20);

    return (reviews as List)
        .where((e) => e['booking'] != null) // guard against null joins
        .map((e) => ReviewModel.fromMap(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Map<String, dynamic>>> getBookingsForDate(
      String terraceId, DateTime date) async {
    try {
      final start = DateTime(date.year, date.month, date.day);
      final end = start.add(const Duration(days: 1));
      final data = await supabase
          .from('bookings')
          .select('start_time, end_time, status')
          .eq('terrace_id', terraceId)
          .inFilter('status', ['CONFIRMED', 'ACTIVE'])
          .gte('start_time', start.toIso8601String())
          .lt('start_time', end.toIso8601String());
      return List<Map<String, dynamic>>.from(data as List);
    } catch (e) {
      print('⚠️ Error loading bookings (RLS restricted or unauthenticated): $e');
      return const [];
    }
  }

  Future<List<Map<String, dynamic>>> getActiveSlotHolds(String terraceId) async {
    try {
      final data = await supabase
          .from('slot_holds')
          .select('start_time, end_time, status')
          .eq('terrace_id', terraceId)
          .eq('status', 'ACTIVE')
          .gte('held_until', DateTime.now().toIso8601String());
      return List<Map<String, dynamic>>.from(data as List);
    } catch (e) {
      print('⚠️ Error loading slot holds: $e');
      return const [];
    }
  }

  Future<String> createTerrace({
    required String hostId,
    required String area,
    required String addressLine,
    required int maxCapacity,
    required int floorLevel,
    required String terraceDirection,
    required List<String> photos,
    required int rate,
    required Map<String, dynamic> permissions,
  }) async {
    final terrace = await supabase
        .from('terraces')
        .insert({
          'host_id': hostId,
          'title': 'My Terrace - $area',
          'area': area,
          'city': 'Chennai',
          'address_line': addressLine,
          'access_category': 'INDIVIDUAL_HOUSE',
          'max_capacity': maxCapacity,
          'verification': 'VERIFIED',
          'is_active': true,
          'creator_ready': false,
          'floor_level': floorLevel,
          'terrace_direction': terraceDirection,
          'noise_environment': 'MODERATE',
          'photos': photos,
        })
        .select()
        .single();

    final terraceId = terrace['id'] as String;

    await Future.wait([
      supabase.from('terrace_permissions').insert({
        'terrace_id': terraceId,
        ...permissions,
      }),
      supabase.from('terrace_rates').insert({
        'terrace_id': terraceId,
        'duration_type': 'HOURLY',
        'rate': rate,
      }),
    ]);

    return terraceId;
  }
}
