import Vue from 'vue';
import Vuex, {Store} from 'vuex';
import state from './state';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';
import likeReward from './modules/likeAndReward';
import addressSign from './modules/addressSign';

Vue.use(Vuex);

const store: Store<any> = new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  modules:{
    likeReward,
    addressSign
  },
  strict: false
});

export default store;
