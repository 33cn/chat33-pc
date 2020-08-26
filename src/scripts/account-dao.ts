import Datasource from '@/scripts/data-source';
import Dao from '@/scripts/dao';
import { TableName } from '@/config/config-enum';

export default class AccountDao extends Dao {
    public constructor(dataSource: Datasource) {
        super(dataSource)
    }
    public createTable() {
        const sql = `CREATE TABLE IF NOT EXISTS ${TableName.Account} (
            ID INTEGER PRIMARY KEY NOT NULL,
            USER_ID CHAR(10),
            MNEMONIC_WORD CHAR(255),
            PRIVATE_KEY CHAR(255),
            PUBLIC_KEY CHAR(255),
            PASSWORD BLOB,
            TIME BIGINT
            ) WITHOUT ROWID`
        return this.dataSource.run(sql, [])
    }
    private createNewTable() {
        const sql = `CREATE TABLE IF NOT EXISTS AccountTemp (
            ID INT PRIMARY KEY NOT NULL,
            USER_ID CHAR(10),
            MNEMONIC_WORD CHAR(255),
            PRIVATE_KEY CHAR(255),
            PUBLIC_KEY CHAR(255),
            PASSWORD BLOB,
            TIME BIGINT
            ) WITHOUT ROWID`
        return this.dataSource.run(sql, [])
    }
    /**
   * 保存账户公私钥和助记词
   */
    public insertKeysAndNumenicWord(id: string, privateKey: string, publicKey: string, numenic: string) {
        const sql = `INSERT INTO ${TableName.Account} (ID,PRIVATE_KEY,PUBLIC_KEY,MNEMONIC_WORD) VALUES (?,?,?,?)`
        return this.dataSource.run(sql, [id, privateKey, publicKey, numenic]).catch((error: any) => {
            console.log(error);
        })
    }
    /**
     * 保存助记词
     */
    public insertMnemonicWord(id:string, mnemonic: string) {
        const sql = `INSERT INTO ${TableName.Account} (ID,MNEMONIC_WORD) VALUES (?,?)`
        return this.dataSource.run(sql, [id, mnemonic]).catch((error: any) => {
            console.log(error);
        })
    }

    /**
     * 替换助记词和公私钥
     */
    public replaceMnemonic(id: string, privateKey: string, publicKey: string, numenic: string) {
        const sql = `REPLACE INTO ${TableName.Account} (ID,PRIVATE_KEY,PUBLIC_KEY,MNEMONIC_WORD,PASSWORD) VALUES (?,?,?,?,?)`
        return this.dataSource.run(sql, [id, privateKey, publicKey, numenic]).catch((error: any) => {
            console.log(error);
        })
    }

    public async getMnemonicWord() {
        try {
            const sql = `SELECT MNEMONIC_WORD FROM ${TableName.Account} WHERE ID = 1`
            const obj = await this.dataSource.get(sql);
            return obj['MNEMONIC_WORD'];
        } catch (e) {
            console.log(e)
        }
    }

    public async getPrivateKey() {
        try {
            const sql = `SELECT PRIVATE_KEY FROM ${TableName.Account} WHERE ID = 1`
            const obj = await this.dataSource.get(sql);
            return obj['PRIVATE_KEY'];
        } catch (e) {
            console.log(e)
        }
    }

    public async getPublicKey() {
        try {
            const sql = `SELECT PUBLIC_KEY FROM ${TableName.Account} WHERE ID = 1`
            const obj = await this.dataSource.get(sql);
            return obj ? obj['PUBLIC_KEY'] : '';
        } catch (e) {
            console.log(e)
        }
    }

    public updateMnemonicWord(mnemonicWord: string) {
        const sql = `UPDATE ${TableName.Account} SET MNEMONIC_WORD = ? WHERE ID = 1`
        return this.dataSource.run(sql, [mnemonicWord]).catch((error: any) => {
            console.log(error);
        })
    }

    public detete(id: string | number) {
        const sql = `DELETE FROM ${TableName.Account} WHERE ID = ?`
        return this.dataSource.run(sql, [id]).catch((error: any) => {
            console.log(error);
        })
    }

    public setPassWord(password: string) {
        const sql = `UPDATE ${TableName.Account} SET PASSWORD = ? WHERE ID = 1`
        return this.dataSource.run(sql, [password]).catch((error: any) => {
            console.log(error);
        })
    }

    public async getPassWord() {
        try {
            const sql = `SELECT PASSWORD FROM ${TableName.Account} WHERE ID = 1`
            var obj = await this.dataSource.get(sql);
            return obj ? String(obj['PASSWORD']) : null;
        } catch (e) {
            console.error(e);
        }
    }

    public async getMnunomic() {
        try {
            const sql = `SELECT MNEMONIC_WORD FROM ${TableName.Account} WHERE ID = 1`
            var obj = await this.dataSource.get(sql);
            return obj ? obj['MNEMONIC_WORD'] : null;
        } catch (e) {
            console.error(e);
        } 
    }

    /**
    *  更新本地数据库
    */
    public async updateAccountTable() {
        try {
            const getStructureSql = `PRAGMA table_info(${TableName.Account})`;
            const results: any[] = await this.dataSource.all(getStructureSql);
            const snapExist = results.find((item) => item.name === 'PASSWORD'); // v2.2.0版本更新：增加PASSWORD
            if (!snapExist) {
                await this.addPassword(TableName.Account);
            }
            if (snapExist && snapExist.type !== "BLOB") {
                this.updateColumn();
            }
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * 创建新的表结构
     * @param COLUMN 
     */
    private updateColumn() {
        this.dataSource.db.serialize(() => {
            this.dataSource.db.run("BEGIN TRANSACTION");//开启数据库事务
            this.createNewTable();
            this.dataSource.run(`INSERT INTO AccountTemp(USER_ID,MNEMONIC_WORD,PRIVATE_KEY,PUBLIC_KEY,PASSWORD,TIME) SELECT USER_ID,MNEMONIC_WORD,PRIVATE_KEY,PUBLIC_KEY,PASSWORD,TIME FROM Account`);
            this.dataSource.run("DROP TABLE Account");
            this.dataSource.run("ALTER TABLE AccountTemp RENAME TO Account");
            this.dataSource.db.run("COMMIT TRANSACTION");
        })
    }

    public addPassword(tableName:string) {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN PASSWORD BLOB`;
        return this.dataSource.run(sql, []);
    }
}