import '../models/booking_model.dart';
import '../supabase_client.dart';

class BookingRepository {
  Future<bool> hasConflict(
      String terraceId, DateTime start, DateTime end) async {
    final data = await supabase
        .from('bookings')
        .select('id')
        .eq('terrace_id', terraceId)
        .inFilter('status', ['CONFIRMED', 'ACTIVE'])
        .lt('start_time', end.toIso8601String())
        .gt('end_time', start.toIso8601String());
    return (data as List).isNotEmpty;
  }

  Future<BookingModel> createBooking({
    required String guestId,
    required String terraceId,
    required DateTime startTime,
    required DateTime endTime,
    required String purpose,
    required int guestCount,
    required int ratePerUnit,
    required String hostId,
  }) async {
    final conflict = await hasConflict(terraceId, startTime, endTime);
    if (conflict) throw Exception('SLOT_TAKEN');

    final durationHours = endTime.difference(startTime).inMinutes / 60.0;
    final multiplier = _priceMultiplier(startTime.hour);
    final timeCost = (ratePerUnit * durationHours * multiplier).round();
    const cleaningFee = 150;
    const utilityFee = 50;
    const securityDeposit = 500;
    final subtotal = timeCost + cleaningFee + utilityFee;
    final platformFee = (subtotal * 0.18).round();
    final total = subtotal + platformFee + securityDeposit;

    final holdResult = await supabase
        .from('slot_holds')
        .insert({
          'terrace_id': terraceId,
          'held_by_user_id': guestId,
          'start_time': startTime.toIso8601String(),
          'end_time': endTime.toIso8601String(),
          'held_until': DateTime.now().add(const Duration(minutes: 8)).toIso8601String(),
          'status': 'ACTIVE',
        })
        .select()
        .single();

    final holdId = holdResult['id'] as String;

    final bookingResult = await supabase
        .from('bookings')
        .insert({
          'guest_id': guestId,
          'terrace_id': terraceId,
          'duration_type': 'HOURLY',
          'start_time': startTime.toIso8601String(),
          'end_time': endTime.toIso8601String(),
          'purpose': purpose,
          'guest_count': guestCount,
          'status': 'CONFIRMED',
          'rate_per_unit': ratePerUnit,
          'total_time_cost': timeCost.toDouble(),
          'cleaning_fee': cleaningFee,
          'utility_fee': utilityFee,
          'security_deposit': securityDeposit,
          'platform_fee': platformFee.toDouble(),
          'total_charged': total.toDouble(),
          'digital_waiver_signed': true,
        })
        .select()
        .single();

    final bookingId = bookingResult['id'] as String;

    await supabase.from('slot_holds').update({
      'booking_id': bookingId,
      'status': 'CONVERTED',
    }).eq('id', holdId);

    await supabase.from('notifications').insert({
      'user_id': hostId,
      'title': 'New booking',
      'body': '${startTime.toString().substring(0, 10)} ${startTime.hour}:00',
      'type': 'BOOKING_CONFIRMED',
      'booking_id': bookingId,
    });

    return BookingModel.fromMap(bookingResult);
  }

  Future<List<BookingModel>> getUserBookings(String userId) async {
    final data = await supabase
        .from('bookings')
        .select('*, terraces(title, platform_photo_urls, photos)')
        .eq('guest_id', userId)
        .order('start_time', ascending: false);
    return (data as List)
        .map((e) => BookingModel.fromMap(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> cancelBooking(String bookingId) async {
    await supabase
        .from('bookings')
        .update({'status': 'CANCELLED'}).eq('id', bookingId);
  }

  Future<void> submitReview({
    required String bookingId,
    required String reviewerId,
    required String revieweeId,
    required int rating,
    required String comment,
  }) async {
    await supabase.from('reviews').insert({
      'booking_id': bookingId,
      'reviewer_id': reviewerId,
      'reviewee_id': revieweeId,
      'rating': rating,
      'comment': comment,
      'review_type': 'GENERAL',
    });
  }

  double _priceMultiplier(int hour) {
    if (hour >= 16 && hour < 20) return 1.5;
    if (hour >= 7 && hour < 11) return 0.8;
    if (hour >= 20) return 1.2;
    return 1.0;
  }
}
