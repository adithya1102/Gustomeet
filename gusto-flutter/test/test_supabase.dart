import 'package:supabase_flutter/supabase_flutter.dart';
import '../lib/core/config/supabase_config.dart';

void main() async {
  print('Initializing Supabase...');
  await Supabase.initialize(
    url: supabaseUrl,
    publishableKey: supabaseAnonKey,
  );
  
  final client = Supabase.instance.client;
  print('Fetching terraces...');
  try {
    final response = await client
        .from('terraces')
        .select('''
          *,
          terrace_rates(*),
          terrace_permissions(*),
          terrace_light_data(*)
        ''');
    print('Terraces fetched successfully: ${response.length} items found.');
    if (response.isNotEmpty) {
      print('First item: ${response.first}');
    }
  } catch (e, stacktrace) {
    print('Error occurred: $e');
    print(stacktrace);
  }
}
