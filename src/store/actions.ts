import { StateTypes } from './types';
import { ActionTree } from 'vuex';
import { UserLoggedInfo } from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import { post } from '@/plugins/axios-plugin';
import URLS from '@/config/urls';
import { Muted, TopStatus } from '@/config/const-enums';
import BenzAMRRecorder from 'benz-amr-recorder';
import { ClickAudioParam } from '@/config/type';
import SnapAudioMsg from '@/object/messages/snapMsg/SnapAudioMsg';
import {showToast} from '@/plugins/Toast';

const actions: ActionTree<StateTypes, any> = {
  /**
   * 删除好友
   * @example @Action public deleteFriend!: (target: string | Friend) => Promise<void>;
   */
  async deleteFriend({ commit, state }, target: string | Friend): Promise<void> {
    let friend = target as Friend;
    if (typeof target === 'string') { // 传的是好友id
      const exist = state.friendList.find((item) => item.id === target);
      if (!exist) {
        return;
      }
      friend = exist;
    }
    const data = await post(URLS.DELETE_FRIEND, { id: friend.id });
    if (data) {
      commit('removeTarget', friend);
      if (state.chatTarget === friend) {
        commit('setChatTarget', null);
      }
    }
  },
  /**
   * 删除群
   * @example @Action public deleteGroup!: (target: Group) => Promise<void>;
   */
  async deleteGroup({ commit, state }, target: Group): Promise<void> {
    if (await post(URLS.DELETE_GROUP, { roomId: target.id })) {
      commit('removeTarget', target);
      if (state.chatTarget === target) {
        commit('setChatTarget', null);
      }
    }
  },
  /**
   * 退出群
   * @example @Action public quitGroup!: (target: Group) => Promise<void>;
   */
  async quitGroup({ commit, state }, target: Group): Promise<void> {
    if (await post(URLS.QUIT_GROUP, { roomId: target.id })) {
      commit('removeTarget', target);
      if (state.chatTarget === target) {
        commit('setChatTarget', null);
      }
    }
  },

  /**
   * 获取好友信息并添加好友
   * @example @Action public addFriendById!: (id: string) => Promise<void>;
   */
  async addFriendById({ commit, state }, id: string): Promise<void> {
    const data = await post(URLS.GET_USER_INFO, { id });
    if (data) {
      const newFriend = new Friend(Object.assign({}, data, { isTop: data.stickyOnTop === TopStatus.Yes, often: false, muted: data.noDisturbing === Muted.YES, me: state.myInfo }));
      commit('handleAddFriend', newFriend);
    }
  },
  /**
   * 点击播放语音
   * @example @Action public clickAudio!: (param: ClickAudioParam) => void;
   */
  clickAudio({ commit, state }, { audioMessage, target }: ClickAudioParam): void { // todo player移入Message?
    const oldAudio = state.audioPlaying;
    if (state.audioPlayer) { // 取消播放或切换播放另一个:结束原播放
      state.audioPlayer.stop();
      commit('setAudioPlayer', null);
    }
    commit('setAudioPlaying', null);
    if (audioMessage !== oldAudio) { // 开始播放或切换播放另一个: 开始新播放
      const player = new BenzAMRRecorder();
      commit('setAudioPlayer', player);
      player.initWithUrl(audioMessage.url).then(() => {
        player.onStop(() => {
          commit('setAudioPlayer', null);
          commit('setAudioPlaying', null);
          if ((audioMessage instanceof SnapAudioMsg) && !audioMessage.isSendByMe) {
            audioMessage.startSnapCount(target);
          }
        });
        if ((audioMessage instanceof SnapAudioMsg) && !audioMessage.isSendByMe) {
          player.onPlay(() => {
            audioMessage.cancelSnapCount();
          });
        }
        commit('setAudioPlaying', audioMessage);
        player.play();
        audioMessage.isUnPlayed = false;
      });
    }
  },
  /**
   * 点赞
   */
  async clickLike({ commit, state }, param): Promise<void> {
    const data = await post(URLS.PRAISE_LIKE, param );
    if(data){
      showToast('',{isLike:true}); // todo toast可能重复

      //to显示点赞成功
    };
  }
};

export default actions;
