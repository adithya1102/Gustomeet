import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../data/repositories/chat_repository.dart';
import '../../data/repositories/user_repository.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/app_bar_widget.dart';
import 'chat_screen.dart';

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  final ChatRepository _chatRepo = ChatRepository();
  bool _isLoading = true;
  List<Map<String, dynamic>> _threads = [];

  @override
  void initState() {
    super.initState();
    _loadThreads();
  }

  Future<void> _loadThreads() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isLoading = true);
    try {
      final list = await _chatRepo.getChatThreads(user.id);
      
      // Resolve other user profiles
      final List<Map<String, dynamic>> resolvedThreads = [];
      for (var thread in list) {
        final otherId = thread['otherUserId'] as String;
        final profile = await UserRepository().getUser(otherId);
        
        resolvedThreads.add({
          ...thread,
          'otherUserName': profile?.fullName ?? 'Gusto User',
          'otherUserPhoto': profile?.profilePhotoUrl,
        });
      }

      if (mounted) {
        setState(() {
          _threads = resolvedThreads;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.kBg,
      appBar: const AppBarWidget(title: 'Messages', showBack: true),
      body: RefreshIndicator(
        onRefresh: _loadThreads,
        color: kGreen,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: kGreen))
            : _threads.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    itemCount: _threads.length,
                    itemBuilder: (context, index) {
                      final thread = _threads[index];
                      final lastMsg = thread['lastMessage'] as String;
                      final otherId = thread['otherUserId'] as String;
                      final otherName = thread['otherUserName'] as String;
                      final photoUrl = thread['otherUserPhoto'] as String?;

                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                        decoration: BoxDecoration(
                          color: context.kSurface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: context.kBorder),
                        ),
                        child: ListTile(
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ChatScreen(
                                  receiverId: otherId,
                                  receiverName: otherName,
                                ),
                              ),
                            ).then((_) => _loadThreads());
                          },
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: CircleAvatar(
                            radius: 24,
                            backgroundColor: kGreen.withValues(alpha: 0.1),
                            backgroundImage: photoUrl != null ? NetworkImage(photoUrl) : null,
                            child: photoUrl == null
                                ? const Icon(Icons.person, color: kGreen)
                                : null,
                          ),
                          title: Text(
                            otherName,
                            style: context.tsBodyPrimary.copyWith(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              lastMsg,
                              style: context.tsCaption,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          trailing: Icon(Icons.chevron_right, color: context.kTextSecondary, size: 20),
                        ),
                      );
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_outlined, size: 64, color: context.kTextSecondary),
          const SizedBox(height: 16),
          Text(
            'No messages yet',
            style: context.tsBody.copyWith(color: context.kTextSecondary),
          ),
        ],
      ),
    );
  }
}
