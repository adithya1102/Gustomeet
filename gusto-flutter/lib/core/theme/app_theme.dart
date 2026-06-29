import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

class AppTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark  => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    final bg          = isDark ? const Color(0xFF000000) : const Color(0xFFB5FF66);
    final surface     = isDark ? const Color(0xFF121212) : const Color(0xFFFFFFFF);
    final textPrimary = isDark ? const Color(0xFFFFFFFF) : const Color(0xFF000000);
    final textMuted   = isDark ? const Color(0xFFCCCCCC) : const Color(0xFF333333);
    final border      = isDark ? const Color(0xFFFFFFFF) : const Color(0xFF000000);
    final surfaceHigh = isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF3F3E7);

    final cs = isDark
        ? ColorScheme.dark(
            primary: kGreen, onPrimary: kOnPrimary,
            secondary: kPurple, onSecondary: Colors.white,
            surface: surface, onSurface: textPrimary,
            error: kError, onError: Colors.white,
            outline: border,
          )
        : ColorScheme.light(
            primary: kGreen, onPrimary: kOnPrimary,
            secondary: kPurple, onSecondary: Colors.black,
            surface: surface, onSurface: textPrimary,
            error: kError, onError: Colors.white,
            outline: border,
          );

    final baseTextTheme = isDark
        ? ThemeData.dark().textTheme
        : ThemeData.light().textTheme;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: cs,
      scaffoldBackgroundColor: bg,
      textTheme: GoogleFonts.lexendTextTheme(baseTextTheme).apply(
        bodyColor: textPrimary,
        displayColor: textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.bebasNeue(
          fontSize: 28, fontWeight: FontWeight.bold, color: textPrimary, letterSpacing: 1.2,
        ),
        iconTheme: IconThemeData(color: textPrimary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: kGreen,
          foregroundColor: Colors.black,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
            side: BorderSide(color: border, width: 3),
          ),
          textStyle: GoogleFonts.bebasNeue(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.0),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textPrimary,
          side: BorderSide(color: border, width: 3),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          textStyle: GoogleFonts.bebasNeue(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.0),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(color: border, width: 3),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(color: border, width: 3),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(color: kGreen, width: 3),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(color: kError, width: 3),
        ),
        hintStyle: GoogleFonts.lexend(fontSize: 14, color: textMuted, fontWeight: FontWeight.bold),
        labelStyle: GoogleFonts.lexend(fontSize: 14, color: textMuted, fontWeight: FontWeight.bold),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: border, width: 3),
        ),
        margin: EdgeInsets.zero,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surface,
        selectedColor: kGreen.withValues(alpha: 0.25),
        side: BorderSide(color: border, width: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        labelStyle: GoogleFonts.lexend(fontSize: 13, color: textPrimary, fontWeight: FontWeight.bold),
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 2, space: 1),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: kPurple,
        unselectedItemColor: textMuted,
        elevation: 0,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surface,
        modalBarrierColor: Colors.black87,
        shape: RoundedRectangleBorder(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          side: BorderSide(color: border, width: 3),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: border, width: 3),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: surface,
        contentTextStyle: GoogleFonts.lexend(color: textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(30),
          side: BorderSide(color: border, width: 3),
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
