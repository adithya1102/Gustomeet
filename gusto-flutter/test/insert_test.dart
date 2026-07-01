import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  test('Inspect OpenAPI schema', () async {
    const url = 'https://pzqyuegqwpbptiijmbuy.supabase.co';
    const anonKey =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cXl1ZWdxd3BicHRpaWptYnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzU3OTcsImV4cCI6MjA5NjE1MTc5N30.qErX22ENtoIhpFf4R8vhRxgMqU7bpY7xIy1m8Bfxf6I';

    final headers = {
      'apikey': anonKey,
      'Authorization': 'Bearer $anonKey',
    };

    final rootRes = await http.get(
      Uri.parse('$url/rest/v1/'),
      headers: headers,
    );

    // 200 = schema returned; 401 = RLS blocks schema access (expected in prod).
    expect(rootRes.statusCode, anyOf(equals(200), equals(401)),
        reason: 'Supabase REST root must respond (200 or 401)');

    if (rootRes.statusCode == 401) {
      print('Schema endpoint requires service-role key — skipping path dump.');
      return;
    }

    final body = jsonDecode(rootRes.body);
    if (body is Map<String, dynamic>) {
      final paths = body['paths'] as Map<String, dynamic>?;
      if (paths != null) {
        for (final path in paths.keys) {
          if (path.startsWith('/rpc/')) {
            print('  RPC: $path');
          } else {
            print('  Table/View: $path');
          }
        }
      } else {
        print('No paths key in schema response.');
      }
    }
  });
}
