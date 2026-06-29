import 'package:flutter/material.dart';

// ── Fixed constants (identical in both modes) ──────────────────────────────
const Color kGreen = Color(0xFF33D19E);       // Mint Green
const Color kPurple = Color(0xFF4A3AFF);      // Royal Blue from Elya card
const Color kPink = Color(0xFFE58BF2);        // Violet Pink from eye badge
const Color kError = Color(0xFFFD5C43);       // Coral Orange from Elya arch border
const Color kWarning = Color(0xFFFEC325);     // Mustard Yellow from Disha card
const Color kBlue = Color(0xFF75E2FF);        // Sky Blue
const Color kOnPrimary = Color(0xFF000000);   // Heavy black text

const Color kSlotAvailable = Color(0xFF33D19E);
const Color kSlotBooked = Color(0xFFFD5C43);
const Color kSlotBuffer = Color(0xFFFD5C43);
const Color kSlotActive = Color(0xFFFEC325);
const Color kSlotCutoff = Color(0xFF6B7280);

// ── Palette constants (raw — use via context extension below) ───────────────
const _dBg           = Color(0xFF000000);     // Pitch black
const _dSurface      = Color(0xFF121212);     // Charcoal
const _dSurfaceHigh  = Color(0xFF1E1E1E);
const _dTextPrimary  = Color(0xFFFFFFFF);     // Pure White
const _dTextSecondary= Color(0xFFCCCCCC);
const _dBorder       = Color(0xFFFFFFFF);     // White borders in Dark Mode

const _lBg           = Color(0xFFF9F9FB);     // Clean grid paper white/grey
const _lSurface      = Color(0xFFFFFFFF);     // Stark White
const _lSurfaceHigh  = Color(0xFFF3F3E7);
const _lTextPrimary  = Color(0xFF000000);     // Stark Black
const _lTextSecondary= Color(0xFF333333);
const _lBorder       = Color(0xFF000000);     // Thick Black borders in Light Mode

// ── Adaptive colors — use context.kBg, context.kSurface, etc. ──────────────
extension AppColorsX on BuildContext {
  bool get _dark => Theme.of(this).brightness == Brightness.dark;

  Color get kBg           => _dark ? _dBg           : _lBg;
  Color get kSurface      => _dark ? _dSurface      : _lSurface;
  Color get kSurfaceHigh  => _dark ? _dSurfaceHigh  : _lSurfaceHigh;
  Color get kTextPrimary  => _dark ? _dTextPrimary  : _lTextPrimary;
  Color get kTextSecondary=> _dark ? _dTextSecondary: _lTextSecondary;
  Color get kBorder       => _dark ? _dBorder       : _lBorder;
}
