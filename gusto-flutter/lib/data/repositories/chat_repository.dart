import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/supabase_client.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String message;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'sender_id': senderId,
      'receiver_id': receiverId,
      'message': message,
      'created_at': createdAt.toIso8601String(),
    };
  }

  factory ChatMessage.fromMap(Map<String, dynamic> map) {
    return ChatMessage(
      id: map['id'] as String? ?? '',
      senderId: map['sender_id'] as String? ?? '',
      receiverId: map['receiver_id'] as String? ?? '',
      message: map['message'] as String? ?? '',
      createdAt: DateTime.parse(map['created_at'] as String? ?? DateTime.now().toIso8601String()),
    );
  }
}

class ChatRepository {
  static const String _localChatsKey = 'gusto_local_chats';

  // Fetch chat messages between two users
  Future<List<ChatMessage>> getMessages(String currentUserId, String otherUserId) async {
    try {
      final response = await supabase
          .from('chat_messages')
          .select()
          .or('and(sender_id.eq.$currentUserId,receiver_id.eq.$otherUserId),and(sender_id.eq.$otherUserId,receiver_id.eq.$currentUserId)')
          .order('created_at', ascending: true);
      
      final list = List<Map<String, dynamic>>.from(response as List);
      return list.map((m) => ChatMessage.fromMap(m)).toList();
    } catch (e) {
      // Fallback to local storage if table doesn't exist
      print('⚠️ Chat Supabase Sync Error (falling back to local storage): $e');
      return _getLocalMessages(currentUserId, otherUserId);
    }
  }

  // Send a message
  Future<ChatMessage> sendMessage({
    required String senderId,
    required String receiverId,
    required String message,
  }) async {
    final msg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      senderId: senderId,
      receiverId: receiverId,
      message: message,
      createdAt: DateTime.now(),
    );

    try {
      final response = await supabase
          .from('chat_messages')
          .insert(msg.toMap())
          .select()
          .single();
      return ChatMessage.fromMap(response);
    } catch (e) {
      print('⚠️ Chat Supabase Send Error (saved to local fallback storage): $e');
      await _saveMessageLocally(msg);
      return msg;
    }
  }

  // Fetch unique chat threads for the current user
  Future<List<Map<String, dynamic>>> getChatThreads(String currentUserId) async {
    try {
      // To get chats, we fetch all messages of the user and find unique other users
      final response = await supabase
          .from('chat_messages')
          .select()
          .or('sender_id.eq.$currentUserId,receiver_id.eq.$currentUserId')
          .order('created_at', ascending: false);

      final list = List<Map<String, dynamic>>.from(response as List);
      final messages = list.map((m) => ChatMessage.fromMap(m)).toList();
      return _buildThreadsFromMessages(messages, currentUserId);
    } catch (e) {
      print('⚠️ Chat Threads Fetch Error: $e');
      final localMsgs = await _getAllLocalMessages();
      return _buildThreadsFromMessages(localMsgs, currentUserId);
    }
  }

  // --- Local Fallback Helpers ---

  Future<List<ChatMessage>> _getLocalMessages(String currentUserId, String otherUserId) async {
    final all = await _getAllLocalMessages();
    return all.where((m) =>
        (m.senderId == currentUserId && m.receiverId == otherUserId) ||
        (m.senderId == otherUserId && m.receiverId == currentUserId)).toList();
  }

  Future<List<ChatMessage>> _getAllLocalMessages() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_localChatsKey) ?? [];
    return list.map((item) => ChatMessage.fromMap(jsonDecode(item) as Map<String, dynamic>)).toList();
  }

  Future<void> _saveMessageLocally(ChatMessage msg) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_localChatsKey) ?? [];
    list.add(jsonEncode(msg.toMap()));
    await prefs.setStringList(_localChatsKey, list);
  }

  List<Map<String, dynamic>> _buildThreadsFromMessages(List<ChatMessage> messages, String currentUserId) {
    final threads = <String, ChatMessage>{};
    for (var m in messages) {
      final otherId = m.senderId == currentUserId ? m.receiverId : m.senderId;
      if (!threads.containsKey(otherId)) {
        threads[otherId] = m;
      }
    }

    return threads.entries.map((entry) {
      return {
        'otherUserId': entry.key,
        'lastMessage': entry.value.message,
        'time': entry.value.createdAt,
      };
    }).toList();
  }
}
