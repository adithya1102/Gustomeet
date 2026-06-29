class Validators {
  static String? phone(String? value) {
    if (value == null || value.isEmpty) return 'Phone number is required';
    if (value.length != 10) return 'Enter a valid 10-digit number';
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(value)) return 'Enter a valid Indian mobile number';
    return null;
  }

  static String? required(String? value, [String label = 'This field']) {
    if (value == null || value.trim().isEmpty) return '$label is required';
    return null;
  }

  static String? ifsc(String? value) {
    if (value == null || value.isEmpty) return 'IFSC is required';
    if (!RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(value.toUpperCase())) {
      return 'Enter a valid IFSC code';
    }
    return null;
  }

  static String? rate(String? value) {
    if (value == null || value.isEmpty) return 'Rate is required';
    final n = int.tryParse(value);
    if (n == null || n < 100) return 'Minimum rate is ₹100/hr';
    if (n > 5000) return 'Maximum rate is ₹5000/hr';
    return null;
  }
}
