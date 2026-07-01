import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import 'neo.dart';

class AppTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark  => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    // Spec: Light #FBF5E9 (warm cream) / Dark #000000 — kept in sync with
    // app_colors.dart _lBg / _dBg so context.kBg always matches the scaffold.
    final bg          = isDark ? const Color(0xFF000000) : const Color(0xFFFBF5E9);
    final surface     = isDark ? const Color(0xFF121212) : const Color(0xFFFFFFFF);
    final textPrimary = isDark ? const Color(0xFFFFFFFF) : const Color(0xFF000000);
    final textMuted   = isDark ? const Color(0xFFCCCCCC) : const Color(0xFF333333);
    final border      = isDark ? const Color(0xFFFFFFFF) : const Color(0xFF000000);

    final cs = isDark
        ? ColorScheme.dark(
            primary: kGreen,  onPrimary: kOnPrimary,
            secondary: kPurple, onSecondary: Colors.white,
            surface: surface, onSurface: textPrimary,
            error: kError,    onError: Colors.white,
            outline: border,
          )
        : ColorScheme.light(
            primary: kGreen,  onPrimary: kOnPrimary,
            secondary: kPurple, onSecondary: Colors.black,
            surface: surface, onSurface: textPrimary,
            error: kError,    onError: Colors.white,
            outline: border,
          );

    final baseTextTheme =
        isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme;

    // ── Shared border helpers ─────────────────────────────────────────────────
    BorderSide bSide({double width = Neo.bwThick, Color? color}) =>
        BorderSide(color: color ?? border, width: width);

    RoundedRectangleBorder rrBorder(double radius, {double bw = Neo.bwThick, Color? color}) =>
        RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: bSide(width: bw, color: color),
        );

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
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textPrimary,
          letterSpacing: 1.2,
        ),
        iconTheme: IconThemeData(color: textPrimary),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: kGreen,
          foregroundColor: Colors.black,
          minimumSize: const Size(double.infinity, 52),
          shape: rrBorder(Neo.rPill),
          textStyle: GoogleFonts.bebasNeue(
            fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.0,
          ),
          elevation: 0,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textPrimary,
          side: bSide(),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Neo.rPill),
          ),
          textStyle: GoogleFonts.bebasNeue(
            fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.0,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Neo.rPill),
          borderSide: bSide(),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Neo.rPill),
          borderSide: bSide(),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Neo.rPill),
          borderSide: bSide(color: kGreen),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Neo.rPill),
          borderSide: bSide(color: kError),
        ),
        hintStyle: GoogleFonts.lexend(
          fontSize: 14, color: textMuted, fontWeight: FontWeight.bold,
        ),
        labelStyle: GoogleFonts.lexend(
          fontSize: 14, color: textMuted, fontWeight: FontWeight.bold,
        ),
      ),

      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: rrBorder(Neo.rLg),
        margin: EdgeInsets.zero,
      ),

      chipTheme: ChipThemeData(
        backgroundColor: surface,
        selectedColor: kGreen.withValues(alpha: 0.25),
        side: bSide(width: Neo.bw),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Neo.rPill),
        ),
        labelStyle: GoogleFonts.lexend(
          fontSize: 13, color: textPrimary, fontWeight: FontWeight.bold,
        ),
      ),

      dividerTheme: DividerThemeData(color: border, thickness: Neo.bw, space: 1),

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
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(Neo.rLg),
          ),
          side: bSide(),
        ),
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        shape: rrBorder(Neo.r),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: surface,
        contentTextStyle: GoogleFonts.lexend(
          color: textPrimary, fontSize: 14, fontWeight: FontWeight.bold,
        ),
        shape: rrBorder(Neo.rPill),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
