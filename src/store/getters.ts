import {StateTypes} from '@/store/types';
import {GetterTree} from 'vuex';

const getters: GetterTree<StateTypes, any> = {
  // @Getter public groupListNoTemp!: Group[];
  groupListNoTemp: (state) => state.groupList.filter((item) => !item.isTemp),
  // @Getter public friendListNoTemp!: Friend[];
  friendListNoTemp: (state) => state.friendList.filter((item) => !item.isTemp)
};

export default getters;
