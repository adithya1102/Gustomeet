import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';

extension StringExtensions on String {
  String get capitalize => isEmpty ? this : '${this[0].toUpperCase()}${substring(1).toLowerCase()}';
  String get initials {
    final parts = trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return isEmpty ? '' : this[0].toUpperCase();
  }
}

extension DateTimeExtensions on DateTime {
  String get dateLabel => DateFormat('EEE, MMM d').format(this);
  String get timeLabel => DateFormat('h:mm a').format(this);
  String get fullLabel => DateFormat('EEE, MMM d • h:mm a').format(this);
  bool get isToday {
    final now = DateTime.now();
    return year == now.year && month == now.month && day == now.day;
  }
}

extension ContextExtensions on BuildContext {
  void showSnackBar(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? kError : kGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  double get screenWidth => MediaQuery.of(this).size.width;
  double get screenHeight => MediaQuery.of(this).size.height;
}

extension IntlExtensions on num {
  String get inr => '₹${NumberFormat('#,##,###').format(this)}';
}
