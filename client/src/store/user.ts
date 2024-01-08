import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import Cookie, { CookieAttributes } from 'js-cookie';

const TOKEN_COOKIE_NAME = 'token';
const LOGIN_COOKIE_NAME = 'login';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | undefined>(Cookie.get(TOKEN_COOKIE_NAME));
  const login = ref<string | undefined>(Cookie.get(LOGIN_COOKIE_NAME));

  const isAuthenticated = computed(
    () => Boolean(token.value) && Boolean(login.value),
  );

  /**
   * Save the user data to store.
   * @param userToken
   * @param userLogin
   * @param remember
   */
  const save = (
    userToken: string,
    userLogin: string,
    remember: boolean = false,
  ) => {
    const cookieOptions = {
      expires: remember ? 14 : undefined,
    } satisfies CookieAttributes;

    Cookie.set(TOKEN_COOKIE_NAME, userToken, cookieOptions);
    Cookie.set(LOGIN_COOKIE_NAME, userLogin, cookieOptions);

    token.value = userToken;
    login.value = userLogin;
  };

  /** Logout the user and delete all auth cookies. */
  const logout = () => {
    Cookie.remove(TOKEN_COOKIE_NAME);
    Cookie.remove(LOGIN_COOKIE_NAME);

    token.value = undefined;
    login.value = undefined;
  };

  return { token, login, isAuthenticated, save, logout };
});