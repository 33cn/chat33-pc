import { addressSignType } from '../types';

const addressSign: addressSignType = {
    namespaced: true,
    state: {
        aitList: [],
        showFriendList: false,
    },
    getters: {

    },
    actions: {
        haddleAddress({state, commit, rootState}:any,param:any) {

        }
    },
    mutations: {
        setPageShowing(state:any, payload: any): void {
            state.showFriendList = payload.showFriendList;
        },
        // setAddressPersonName(state:any, addressPersonName:string): void {
        //     state.addressPersonList.push(addressPersonName);
        // },
        // removeAddressNameList(state:any): void {
        //     state.addressPersonList = [];
        // },
        setAitInfoList(state:any, payload: any): void {
            const arr = state.aitList;
            arr.push(payload.aitInfo);
            state.aitList = arr;
            // Array.from(new Set(arr));
        },
        clearAitInfoList(state:any):void {
            state.aitList = [];
        }
    }
}

export default addressSign;