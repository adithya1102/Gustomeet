import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'firebase_options.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'data/supabase_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase init — log failures but NEVER return early; runApp() must always
  // be called or the app shows a permanent black screen.
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e) {
    debugPrint('Firebase init error (auth features will be unavailable): $e');
  }

  // In supabase_flutter 2.x, `accessToken` is a direct top-level parameter
  // of Supabase.initialize (NOT inside FlutterAuthClientOptions).
  // `publishableKey` is the new name for what was previously `anonKey`.
  await Supabase.initialize(
    url: supabaseUrl,
    publishableKey: supabaseAnonKey,
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