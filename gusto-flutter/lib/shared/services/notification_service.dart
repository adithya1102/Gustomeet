import 'package:flutter/foundation.dart';
import '../../data/supabase_client.dart';

class NotificationService {
  static Future<void> logNotification({
    required String userId,
    required String title,
    required String body,
    required String type,
    String? bookingId,
  }) async {
    try {
      await supabase.from('notifications').insert({
        'user_id': userId,
        'title': title,
        'body': body,
        'type': type,
        'booking_id': bookingId,
        'is_read': false,
      });
    } catch (e) {
      debugPrint('NotificationService error: $e');
    }
  }
}
