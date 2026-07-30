import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useRouter, type Href } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Menu = {
  key: string;
  label: string;
  icon: {
    ios: SFSymbol;
    android: AndroidSymbol;
    web: AndroidSymbol;
  };
  /** 이동할 경로. 없으면 아직 만들지 않은 기능이라 'Coming Soon' 으로 표시한다. */
  href?: Href;
  image?: number;
};

const MENUS: Menu[] = [
  {
    key: 'homework',
    label: '숙제',
    icon: { ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' },
    image: require('../../../assets/images/menu-icons/homework.png'),
    href: '/homework',
  },
  {
    key: 'vocabulary',
    label: '단어시험',
    icon: { ios: 'textformat', android: 'menu_book', web: 'menu_book' },
    image: require('../../../assets/images/menu-icons/vocabulary.png'),
    href: '/vocabulary',
  },
  {
    key: 'listening',
    label: '리스닝',
    icon: { ios: 'headphones', android: 'headphones', web: 'headphones' },
    image: require('../../../assets/images/menu-icons/listening.png'),
    href: '/listening',
  },
  {
    key: 'qna',
    label: 'Q&A',
    icon: { ios: 'questionmark.circle', android: 'help', web: 'help' },
    image: require('../../../assets/images/menu-icons/qna.png'),
    href: '/qna',
  },
  {
    key: 'course',
    label: '인강',
    icon: { ios: 'play.circle', android: 'play_circle', web: 'play_circle' },
    image: require('../../../assets/images/menu-icons/course.png'),
  },
  {
    key: 'wiki',
    label: 'Wiki',
    icon: { ios: 'books.vertical', android: 'dictionary', web: 'dictionary' },
    image: require('../../../assets/images/menu-icons/wiki.png'),
  },
];

export function MenuGrid() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {MENUS.map((menu) => (
        <Pressable
          key={menu.key}
          disabled={!menu.href}
          onPress={menu.href ? () => router.push(menu.href!) : undefined}
          style={({ pressed }) => [
            styles.tile,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.backgroundSelected,
              opacity: pressed ? 0.82 : menu.href ? 1 : 0.58,
            },
          ]}>
          <View style={styles.iconBubble}>
            {menu.image ? (
              <Image source={menu.image} style={styles.imageIcon} resizeMode="contain" />
            ) : (
              <View style={[styles.symbolBubble, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={menu.icon}
                  size={26}
                  tintColor={Palette.primary}
                  weight={{ ios: 'regular', android: { name: 'outlined', font: 400 } }}
                  fallback={
                    <ThemedText type="smallBold" style={styles.iconFallback}>
                      {menu.label[0]}
                    </ThemedText>
                  }
                />
              </View>
            )}
          </View>
          <ThemedText type="smallBold">{menu.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  tile: {
    width: '31%',
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 104,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  iconBubble: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFallback: {
    minWidth: 26,
    color: Palette.primary,
    fontSize: 26,
    lineHeight: 30,
    textAlign: 'center',
  },
  imageIcon: {
    width: 54,
    height: 54,
  },
});
