import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'data/supabase_client.dart';

import 'core/config/firebase_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase must be ready before Supabase so the accessToken closure can
  // call FirebaseAuth immediately on the first Supabase request.
  try {
    if (kIsWeb) {
      await Firebase.initializeApp(options: firebaseWebOptions);
    } else {
      await Firebase.initializeApp();
    }
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    // Every Supabase DB/Storage request carries the Firebase JWT as the
    // bearer token, enabling RLS policies that rely on auth.uid().
    accessToken: () async =>
        await FirebaseAuth.instance.currentUser?.getIdToken(true),
  );

  runApp(const ProviderScope(child: GustoMeetsApp()));
}

class GustoMeetsApp extends ConsumerWidget {
  const GustoMeetsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Gusto Meets',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
