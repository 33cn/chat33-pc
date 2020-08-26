import { likeRewardType } from '../types';

const likeReward: likeRewardType = {
    namespaced: true,
    state: {
        messageId: '',
        showLikeView: false,
        showLikeHis: false,
        isFromListEnter: false,
    },
    getters: {

    },
    actions: {
        combineEffect({state, commit, rootState}:any,param:any) {
            console.log("============================");
            commit('setPara',{isFromListEnter:false});
            commit('setShowing',{showLikeView:true});
        }
    },
    mutations: {
        setShowing(state:any, param: any): void {
            state.showLikeView = param.showLikeView;
        },
        setShowLikeHis(state:any, showLikeHis:boolean): void {
            state.showLikeHis = showLikeHis;
        },
        setMessageId(state:any, messageId:string): void {
            state.messageId = messageId;
        },
        setPara(state:any,payload:any): void {
            console.log(payload);
            const para = Object.keys(payload)[0];
            state[para] =  payload[para];
        }
    }
}

export default likeReward;