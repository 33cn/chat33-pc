import { crypto } from 'crypto-browserify';
import { MySocket } from '@/scripts/object';
import Friend from '@/object/targets/Friend';
import Group from '@/object/targets/Group';
import { generateSessionKey, create256Key, encryptSymmetric, EncPasswd, SeedEncKey, SeedDecKey } from '@/utils/tool';
import AccountDao from "@/scripts/account-dao";
import Datasource from '@/scripts/data-source';
import { seed } from '@33cn/wallet-base';
import GroupKeyDao from "@/scripts/groupKey-dao";

export default class Cryptography {
    public privateKey: string;
    public accountDao: any;
    public groupKeyDao: any;
    constructor(userId: string = '1') {
        this.privateKey = '';
        this.accountDao = new AccountDao(Datasource.getInstance());
        this.groupKeyDao = new GroupKeyDao(Datasource.getInstance());
    }
    public async getPrivateKey() {
        return await this.accountDao.getPrivateKey();
    }
    public async getPublicKey() {
        return await this.accountDao.getPublicKey();
    }
    /**
     * 生成群内各成员的被加密的群密钥列表
     * @param targetList 好友列表
     */
    public async generateGroupSecretKeys(menberlist: any[]): Promise<any[]> {
        let secrect: any[] = [];
        this.privateKey = await this.getPrivateKey();
        const groupKey = create256Key();
        return secrect = menberlist.map((item) => {
            const sessionKey = generateSessionKey(this.privateKey, item.key);
            const encryptedKey = encryptSymmetric(sessionKey, groupKey);
            return {
                userId: item.userId,
                key: encryptedKey
            }
        })
    }
    /**
     * 获取助记词的密码
     */
    public async getPassword(): Promise<string> {
        return await this.accountDao.getPassWord();
    }
    /**
     * 设置助记词密码
     */
    public async setPassword(password: string): Promise<any> {
        const encdPassword = await EncPasswd(password);
        return await this.accountDao.setPassWord(encdPassword);
    }
    /**
     * 获取助记词
     */
    public async getMnunomic(): Promise<string> {
        return await this.accountDao.getMnunomic();
    }
    /**
     * 随机生成助记词和公私钥，加密助记词
     */
    public async create(userAccount: string,password: string): Promise<void> {
        //随机生成助记词
        const mnemonic = seed.newMnemonicInCN();
        const wallet = seed.newWalletFromMnemonic(mnemonic);
        const account = wallet.newAccount(userAccount);
        const privateKey = account.hexPrivateKey;
        const publicKey = account.publicKey.toString("hex");

        const encMnemonic = await this.cryptoMnemonicWord(mnemonic,password);

        this.saveAcountKeyAndNumenic("1", privateKey, publicKey, mnemonic);
    }
    /**
     * 随机生成助记词和公私钥，加密助记词并更新
     */
    public async createAndUpdateMnemonic(userAccount: string,password: string): Promise<void> {
        //随机生成助记词
        const mnemonic = seed.newMnemonicInCN();
        const wallet = seed.newWalletFromMnemonic(mnemonic);
        const account = wallet.newAccount(userAccount);
        const privateKey = account.hexPrivateKey;
        const publicKey = account.publicKey.toString("hex");

        const encMnemonic = await this.cryptoMnemonicWord(mnemonic,password);

        this.updateAcountKeyAndMnemonic("1", privateKey, publicKey, encMnemonic);
    }

    /**
     * 更新助记词
     */
    public async createPrK(encMnemonic: string,mnemonic: string,userAccount: string): Promise<void> {
        //通过助记词生成钱包
        const wallet = seed.newWalletFromMnemonic(mnemonic);
        const account = wallet.newAccount(userAccount);
        const privateKey = account.hexPrivateKey;
        const publicKey = account.publicKey.toString("hex");
        this.updateAcountKeyAndMnemonic("1", privateKey, publicKey, encMnemonic);
    }

    public async cryptoMnemonicWord(mnenomicWord: string,password: string):Promise<string> {
        const encdPassword = await EncPasswd(password);
        return  SeedEncKey(encdPassword, mnenomicWord);
    }

    public async decryptoMnemonicWord(mnenomicWord: string,password: string) {
        const encdPassword = await EncPasswd(password);
        return  SeedDecKey(encdPassword, mnenomicWord);
    }

    public saveAcountKeyAndNumenic(
        id: string,
        privateKey: string,
        publicKey: string,
        mnemonic: string
    ) {
        this.accountDao.insertKeysAndNumenicWord(
            id,
            privateKey,
            publicKey,
            mnemonic
        );
    }
    
    public updateAcountKeyAndMnemonic(
        id: string,
        privateKey: string,
        publicKey: string,
        mnemonic: string,
    ) {
        this.accountDao.replaceMnemonic(id, privateKey, publicKey, mnemonic);
    }

    //保存助记词
    public saveMnemonic(
        id: String,
        mnemonic: string
    ){
        this.accountDao.insertMnemonicWord(
            id,
            mnemonic
        );
    }

    public async getLatestGroupKey(groupid:string) {
        return await this.groupKeyDao.getRowByLatestKey(groupid);
    }
}