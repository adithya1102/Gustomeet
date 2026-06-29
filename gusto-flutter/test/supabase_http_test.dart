import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  const url = 'https://pzqyuegqwpbptiijmbuy.supabase.co';
  const anonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cXl1ZWdxd3BicHRpaWptYnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzU3OTcsImV4cCI6MjA5NjE1MTc5N30.qErX22ENtoIhpFf4R8vhRxgMqU7bpY7xIy1m8Bfxf6I';

  final headers = {
    'apikey': anonKey,
    'Authorization': 'Bearer $anonKey',
    'Content-Type': 'application/json',
  };

  // Test 1: bare select all
  print('\n--- Test 1: bare select terraces ---');
  var res = await http.get(
    Uri.parse('$url/rest/v1/terraces?select=id,title,is_active,verification,city&limit=5'),
    headers: headers,
  );
  print('Status: \${res.statusCode}');
  print('Body: \${res.body.substring(0, res.body.length.clamp(0, 300))}');

  // Test 2: with joins
  print('\n--- Test 2: with joins ---');
  res = await http.get(
    Uri.parse('$url/rest/v1/terraces?select=*,terrace_rates(*),terrace_permissions(*),terrace_light_data(*)&is_active=eq.true&limit=3'),
    headers: headers,
  );
  print('Status: \${res.statusCode}');
  if (res.statusCode == 200) {
    final list = jsonDecode(res.body) as List;
    print('Count: \${list.length}');
    if (list.isNotEmpty) {
      final first = list.first as Map<String, dynamic>;
      print("First: ${first['title']}");
      print("  rates: ${first['terrace_rates']}");
      print("  permissions: ${first['terrace_permissions']}");
      print("  light_data: ${first['terrace_light_data']}");
    }
  } else {
    print("Error: ${res.body}");
  }
}
