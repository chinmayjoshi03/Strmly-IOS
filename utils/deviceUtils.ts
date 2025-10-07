import { Dimensions, Platform } from 'react-native';

export const getDeviceInfo = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  
  // iPad detection based on screen dimensions and platform
  const isIPad = Platform.OS === 'ios' && (
    // iPad Mini, iPad Air, iPad Pro dimensions (including 13" iPad Air)
    (width >= 768 && height >= 1024) || // Portrait
    (width >= 1024 && height >= 768) || // Landscape
    (width >= 820 && height >= 1180) || // iPad Air 13" Portrait
    (width >= 1180 && height >= 820)    // iPad Air 13" Landscape
  );
  
  const isTablet = Platform.OS === 'android' && (
    (width >= 600 && aspectRatio < 1.6) ||
    (height >= 600 && aspectRatio > 0.6)
  );
  
  // Detect larger iPads (12.9" Pro, 13" Air) for even more spacing
  const isLargeIPad = Platform.OS === 'ios' && (
    width >= 1024 || height >= 1366 || // 12.9" iPad Pro
    width >= 1180 || height >= 820     // 13" iPad Air
  );
  
  return {
    width,
    height,
    isIPad,
    isTablet,
    isTabletDevice: isIPad || isTablet,
    isLargeIPad,
    aspectRatio
  };
};

export const getResponsiveStyles = () => {
  const { isTabletDevice, isLargeIPad, width } = getDeviceInfo();
  
  return {
    // Search input styles - more conservative margins for large iPads
    searchInput: {
      marginHorizontal: isLargeIPad ? 60 : isTabletDevice ? 40 : 15,
      paddingHorizontal: isLargeIPad ? 30 : isTabletDevice ? 25 : 15,
      paddingVertical: isLargeIPad ? 15 : isTabletDevice ? 12 : 6,
      fontSize: isLargeIPad ? 20 : isTabletDevice ? 18 : 16,
      borderRadius: isLargeIPad ? 35 : isTabletDevice ? 30 : 25,
    },
    
    // Container padding
    containerPadding: {
      paddingHorizontal: isLargeIPad ? 60 : isTabletDevice ? 40 : 15,
    },
    
    // Profile layout - better centering for large iPads
    profileContainer: {
      marginHorizontal: isLargeIPad ? 100 : isTabletDevice ? 60 : 24,
      alignItems: 'center' as const,
    },
    
    // Profile picture container
    profilePictureContainer: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      width: '100%' as const,
    },
    
    // Profile picture size
    profilePictureSize: {
      width: isLargeIPad ? 120 : isTabletDevice ? 100 : 80,
      height: isLargeIPad ? 120 : isTabletDevice ? 100 : 80,
      borderRadius: isLargeIPad ? 60 : isTabletDevice ? 50 : 40,
    },
    
    // Profile picture size for iPhone (original size)
    profilePictureSizePhone: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    
    // Button container spacing (for the row of buttons)
    buttonRowSpacing: {
      gap: isLargeIPad ? 20 : isTabletDevice ? 16 : 8,
    },
    
    // Button row spacing for iPhone (original)
    buttonRowSpacingPhone: {
      gap: 8,
    },
    
    // Individual button padding - bigger on iPad
    buttonPadding: {
      paddingHorizontal: isLargeIPad ? 32 : isTabletDevice ? 24 : 16,
      paddingVertical: isLargeIPad ? 16 : isTabletDevice ? 12 : 8,
      minWidth: isLargeIPad ? 140 : isTabletDevice ? 120 : undefined,
    },
    
    // Button padding for iPhone (original size)
    buttonPaddingPhone: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    
    // Button text size
    buttonTextSize: {
      fontSize: isLargeIPad ? 18 : isTabletDevice ? 16 : 14,
    },
    
    // Button text size for iPhone (original size)
    buttonTextSizePhone: {
      fontSize: 14,
    },
    
    // Stats section spacing
    statsContainer: {
      paddingHorizontal: isLargeIPad ? 60 : isTabletDevice ? 40 : 20,
      gap: isLargeIPad ? 40 : isTabletDevice ? 30 : 20,
    },
    
    // Search tabs container - center on iPad
    searchTabsContainer: {
      justifyContent: isTabletDevice ? 'center' as const : 'flex-start' as const,
      alignItems: 'center' as const,
      flexGrow: isTabletDevice ? 0 : 1,
    },
    
    // Search tab button spacing
    searchTabButton: {
      marginHorizontal: isLargeIPad ? 30 : isTabletDevice ? 25 : 20,
      paddingVertical: isTabletDevice ? 12 : 8,
      paddingHorizontal: isTabletDevice ? 12 : 8,
    },
    
    // Community stats text size
    communityStatsText: {
      fontSize: isLargeIPad ? 20 : isTabletDevice ? 18 : 16,
    },
    
    // Community stats label size
    communityStatsLabel: {
      fontSize: isLargeIPad ? 16 : isTabletDevice ? 14 : 12,
    }
  };
};