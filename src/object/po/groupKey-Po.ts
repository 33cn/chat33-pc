import { groupKeyParam } from '@/config/apiTypings';


export default class GroupKeyPo{
    private _kid:string;
    private _key:string;
    private _groupId:string;
    constructor(vo:groupKeyParam){
        this._kid = vo.KEY_ID
        this._key = vo.KEY
        this._groupId = vo.GROUP_ID
    }

    public get kid() {
        return this._kid;
    }

    public set kid(kid:string) {
        this._kid = kid;
    }

    public get key() {
        return this._key;
    }

    public set key(key:string) {
        this._key = key;
    }

    public get groupid() {
        return this._groupId;
    }

    public set groupid(groupid:string) {
        this._groupId = groupid;
    }
}