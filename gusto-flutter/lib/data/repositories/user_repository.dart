import '../models/user_model.dart';
import '../supabase_client.dart';

class UserRepository {
  Future<UserModel?> getUser(String userId) async {
    final data =
        await supabase.from('users').select().eq('id', userId).maybeSingle();
    if (data == null) return null;
    return UserModel.fromMap(data);
  }

  Future<UserModel> updateProfile({
    required String userId,
    String? fullName,
    String? bio,
    String? profilePhotoUrl,
  }) async {
    final updates = <String, dynamic>{};
    if (fullName != null) updates['full_name'] = fullName;
    if (bio != null) updates['bio'] = bio;
    if (profilePhotoUrl != null) updates['profile_photo_url'] = profilePhotoUrl;

    final data = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    return UserModel.fromMap(data);
  }

  Future<UserModel> updateWalletBalance(String userId, double amount) async {
    final data = await supabase
        .from('users')
        .update({'wallet_balance': amount})
        .eq('id', userId)
        .select()
        .single();
    return UserModel.fromMap(data);
  }

  Future<void> setHasHostProfile(String userId) async {
    await supabase
        .from('users')
        .update({'has_host_profile': true}).eq('id', userId);
  }
}
