import 'package:supabase_flutter/supabase_flutter.dart';

export '../core/config/supabase_config.dart' show supabaseUrl, supabaseAnonKey;


SupabaseClient get supabase => Supabase.instance.client;
