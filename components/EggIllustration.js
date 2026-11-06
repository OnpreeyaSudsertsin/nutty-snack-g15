
import React from 'react';
import { View } from 'react-native';

export default function EggIllustration({
  width = 180,
  height = 220,
  opacity = 0.15,
}) {
  const lineColor = `rgba(16, 35, 75, ${opacity})`;

  return (
    <View
      style={{
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Egg outline */}
      <View
        style={{
          position: 'absolute',
          width: width * 0.92,
          height: height * 0.94,
          borderWidth: 3,
          borderColor: lineColor,
          borderRadius: width,
        }}
      />

      {/* Zigzag crack */}
      <View
        style={{
          position: 'absolute',
          top: height * 0.43,
          width: width * 0.92,
          height: height * 0.15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {[
          { rotate: '45deg', left: 0 },
          { rotate: '-45deg', left: 1 },
          { rotate: '45deg', left: 2 },
          { rotate: '-45deg', left: 3 },
          { rotate: '45deg', left: 4 },
          { rotate: '-45deg', left: 5 },
        ].map((item, index) => (
          <View
            key={index}
            style={{
              width: width * 0.115,
              height: 3,
              backgroundColor: lineColor,
              transform: [{ rotate: item.rotate }],
              marginHorizontal: -width * 0.005,
            }}
          />
        ))}
      </View>
    </View>
  );
}
