import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/supabase_client.dart';
import 'auth_provider.dart';

final wishlistProvider = StateNotifierProvider<WishlistNotifier, Set<String>>((ref) {
  final userId = ref.watch(currentUserProvider)?.id;
  return WishlistNotifier(userId)..init();
});

class WishlistNotifier extends StateNotifier<Set<String>> {
  final String? userId;
  static const String _prefKey = 'gusto_wishlist_ids';

  WishlistNotifier(this.userId) : super({});

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final localList = prefs.getStringList(_prefKey) ?? [];
    state = Set<String>.from(localList);

    // Sync from Supabase if authenticated and connection works
    if (userId != null) {
      try {
        final response = await supabase
            .from('wishlists')
            .select('terrace_id')
            .eq('user_id', userId!);
        
        final dbIds = (response as List).map((item) => item['terrace_id'] as String).toSet();
        if (dbIds.isNotEmpty) {
          state = dbIds;
          await prefs.setStringList(_prefKey, dbIds.toList());
        }
      } catch (e) {
        print('⚠️ Wishlist Supabase sync warning (using local wishlist): $e');
      }
    }
  }

  Future<void> toggleWishlist(String terraceId) async {
    final prefs = await SharedPreferences.getInstance();
    final updated = Set<String>.from(state);
    
    final isAdding = !updated.contains(terraceId);
    if (isAdding) {
      updated.add(terraceId);
    } else {
      updated.remove(terraceId);
    }
    
    state = updated;
    await prefs.setStringList(_prefKey, updated.toList());

    if (userId != null) {
      try {
        if (isAdding) {
          await supabase.from('wishlists').insert({
            'user_id': userId,
            'terrace_id': terraceId,
          });
        } else {
          await supabase
              .from('wishlists')
              .delete()
              .eq('user_id', userId!)
              .eq('terrace_id', terraceId);
        }
      } catch (e) {
        print('⚠️ Wishlist Supabase write warning: $e');
      }
    }
  }

  bool isWishlisted(String terraceId) {
    return state.contains(terraceId);
  }
}
