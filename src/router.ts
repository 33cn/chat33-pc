import Vue from 'vue';
import Router from 'vue-router';
import {RouterName, RouterPath} from '@/config/type';
import UserLogin from './views/user-login.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      redirect: RouterPath.Main
    },
    {
      path: RouterPath.Login,
      name: RouterName.Login,
      component: UserLogin
    },
    {
      path: RouterPath.Main,
      name: RouterName.Main,
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route /* webpackChunkName: "main" */
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/main-page.vue'),
      // redirect: '/'+RouterPath.Chat,
      children: [
        // 消息页
        {
          path: RouterPath.Chat,
          name: RouterName.Chat,
          component: () => import('./views/news-page.vue')
        },
        // 联系人页
        {
          path: RouterPath.Contact,
          name: RouterName.Contact,
          component: () => import('./views/friend-page.vue')
        },
        // 设置页
        {
          path: RouterPath.Set,
          name: RouterName.Set,
          component: () => import('./views/set-page.vue')
        },
        {//默认走嵌套消息页
          path: '',
          component: ()=> import('./views/news-page.vue')
        }
      ]
    }
  ]
});
