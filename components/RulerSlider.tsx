import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  TextInput,
  SafeAreaView,
  ScrollView,
  Animated,
  Image,
  Dimensions,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';

const { width } = Dimensions.get('screen');

interface Props extends ViewProps {
  minVal: number,
  maxVal: number,
  curVal: number,
  onValueChange: (selectedValue: number) => void,
}
const defaultVal = '';
const segmentsLength = 13;
const segmentWidth = 3;
const segmentSpacing = 20;
const snapSegment = segmentWidth + segmentSpacing;
const spacerWidth = (width - segmentWidth) / 2;
const rulerWidth = spacerWidth * 2 + (segmentsLength - 1) * snapSegment;
const indicatorWidth = 100;
const indicatorHeight = 20;

const RulerSlider: React.FC<Props> = ({
  minVal,
  maxVal,
  curVal,
  onValueChange,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // const scrollX = useRef(new Animated.Value(curVal*snapSegment)).current;
  const data = [...Array(segmentsLength).keys()].map(i => i + minVal);
  const step = 2

  useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      // console.log("SEE SCROLL X", value)
      const selectedValue = (Math.round(value / snapSegment) / step + minVal).toFixed(1);
      if (textInputRef && textInputRef.current) {
        textInputRef.current.setNativeProps({
          text: parseFloat(selectedValue) > 0 ? `+${selectedValue} EV` : `${selectedValue} EV`
        });
      }
      onValueChange(parseFloat(selectedValue));
    });

    // if (scrollViewRef && scrollViewRef.current) {
    //   const initialScrollX = (rulerWidth - width) / 2;
    //   // console.log("SEE initialScrollX", initialScrollX)
    //   // console.log("SEE curVal", curVal)
    //   scrollViewRef.current.scrollTo({
    //     // x: initialScrollX + curVal * snapSegment,
    //     x: initialScrollX ,
    //     y: 0,
    //     animated: true
    //   });
    // }
    // Set initial scroll position after mounting
    setTimeout(() => {
      if (scrollViewRef && scrollViewRef.current) {
        const initialScrollX = (rulerWidth - width) / 2 + 1;
        scrollViewRef.current.scrollTo({
          x: initialScrollX,
          y: 0,
          animated: true
        });
      }
    }, 10);

    return () => {
      scrollX.removeListener(listener);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.indicatorWrapper}>
        <TextInput
          ref={textInputRef}
          style={styles.textStyle}
          // defaultValue={defaultVal}
          editable={false}
        />
      </View>
      <View style={styles.rulerContainer}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          contentContainerStyle={styles.scrollViewContainerStyle}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          snapToInterval={snapSegment}
          // contentOffset={{ x: snapSegment * (minVal), y: 0 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={styles.ruler}>
            <View style={styles.spacer} />
            {data.map(i => {
              const mark = i % step === 0;
              return (
                <View
                  key={i}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: '#FFFFFF',
                      height: mark ? 12 : 18,
                      marginRight: i === data.length - 1 ? 0 : segmentSpacing,
                      borderRadius: 5,
                    }
                  ]}
                />
              );
            })}
            <View style={styles.spacer} />
          </View>
        </Animated.ScrollView>
        <View style={styles.indicatorWrapper}>
          <View style={[styles.segment, styles.segmentIndicator]} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // height: 45,
    // backgroundColor: 'rgba(53, 43, 68, 0.40)',
  },
  rulerContainer: {
    paddingTop: 8,
    position: 'relative',
    marginBottom: 20,
  },
  ruler: {
    width: rulerWidth,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  segment: {
    width: segmentWidth,
    borderRadius: 5,
  },
  scrollViewContainerStyle: {
    justifyContent: 'flex-end',
    bottom: 0,
    // zIndex:,
  },
  textStyle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#EEBE2C',
  },
  spacer: {
    width: spacerWidth,
  },
  indicatorWrapper: {
    position: 'absolute',
    // left: (width - indicatorWidth) / 2,
    left: (width ) / 2 -2,
    alignItems: 'center',
    justifyContent: 'center',
    // width: indicatorWidth + 1,
    bottom: 0,
  },
  segmentIndicator: {
    height: indicatorHeight,
    backgroundColor: '#EEBE2C',
    width: 4,
  }
});

export default RulerSlider;
