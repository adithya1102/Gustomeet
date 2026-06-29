import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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

    try {
      final rootRes = await http.get(Uri.parse('$url/rest/v1/'), headers: headers);
      final spec = jsonDecode(rootRes.body) as Map<String, dynamic>;
      final paths = spec['paths'] as Map<String, dynamic>;
      print('Available Database Paths:');
      for (final path in paths.keys) {
        if (path.startsWith('/rpc/')) {
          print('  RPC: $path');
        } else {
          print('  Table/View: $path');
        }
      }
    } catch (e, st) {
      print('Error fetching schema: $e');
      print(st);
      fail('Failed');
    }
  });
}
