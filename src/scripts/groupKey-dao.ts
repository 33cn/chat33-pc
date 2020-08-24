import Datasource from '@/scripts/data-source';
import Dao from '@/scripts/dao';
import { TableName } from '@/config/config-enum';
import { ApiMsg } from '@/config/apiTypings';
import Notify from '@/plugins/NotifyPop';
import groupKeyPo from '@/object/po/groupKey-Po';

export default class GroupKeyDao extends Dao {
    constructor(dataSource: Datasource) {
        super(dataSource)
    }

    async createGroupKeyTable() {
        let sql = `CREATE TABLE IF NOT EXISTS ${TableName.GroupKey} (
            ID INTEGER PRIMARY KEY NOT NULL,
            KEY_ID BIGINT,
            KEY CHAR(255),
            GROUP_ID CHAR(10)
            ) WITHOUT ROWID`

        try {
            const res = await this.dataSource.get(`SELECT count(*) FROM sqlite_master WHERE type='table' AND name = '${TableName.GroupKey}'`);
            if (!res) {
                sql += `;CREATE INDEX index_keyId ON ${TableName.GroupKey} (KEY_ID,GROUP_ID);`
            }
            return await this.dataSource.exec(sql)

        } catch (error) {

        }
    }

    async createNewGroupKeyTable() {
        let sql = `CREATE TABLE IF NOT EXISTS GroupKeyTemp (
            ID INTEGER PRIMARY KEY NOT NULL,
            KEY_ID BIGINT,
            KEY CHAR(255),
            GROUP_ID CHAR(10)
            ) WITHOUT ROWID`

        sql += `;CREATE INDEX index_keyId ON GroupKeyTemp (KEY_ID,GROUP_ID);`
        return await this.dataSource.exec(sql)
    }

    async UpdateGroupKeyTable() {
        try {
            const hasIndex = await this.dataSource.get(`SELECT * FROM sqlite_master WHERE type = 'index' AND tbl_name = "${TableName.GroupKey}"`)
            if (!hasIndex) {
                this.updateColumn();
            }
        } catch (error) {

        }
    }

    private updateColumn() {
        this.dataSource.db.serialize(() => {
            this.dataSource.db.run("BEGIN TRANSACTION");//开启数据库事务
            this.createNewGroupKeyTable();
            this.dataSource.run(`INSERT INTO GroupKeyTemp (ID,KEY_ID,KEY,GROUP_ID) SELECT ID,KEY_ID,KEY,GROUP_ID FROM ${TableName.GroupKey}`);
            this.dataSource.run(`DROP TABLE ${TableName.GroupKey}`);
            this.dataSource.run(`ALTER TABLE GroupKeyTemp RENAME TO ${TableName.GroupKey}`);
            this.dataSource.db.run("COMMIT TRANSACTION");
        })
    }

    public InsertOneRow(apiMsg: ApiMsg, key: string) {
        return new Promise((resolve, reject) => {
            this.dataSource.db.serialize(() => {
                const stmt = this.dataSource.db.prepare(`INSERT OR IGNORE INTO ${TableName.GroupKey} VALUES (?,?,?,?);`);
                stmt.run([apiMsg.logId, apiMsg.msg.kid, key, apiMsg.msg.roomId]);
                stmt.finalize((error: any) => {
                    resolve('success');
                    if (error) {
                        reject();
                        Notify.fail('本地存储失败');
                        throw new Error('本地保存失败');
                    }
                });
            });
        })
    }
    /*
    * 根据最近的key_id查找对应行数据
    */
    public async getRowByLatestKey(targetId: string) {
        try {
            const sql = `SELECT * FROM ${TableName.GroupKey} INDEXED BY index_keyId WHERE GROUP_ID = ? ORDER BY KEY_ID DESC LIMIT 0,1 NOT NULL`;
            const result = await this.dataSource.all(sql, [targetId])
            return result[0] ? new groupKeyPo(result[0]) : null;
        } catch (e) {
            console.log(e)
        }
    }
    /**
     * 根据key_id查找群密钥
     */
    public async getGroupKeyByKeyId(keyId: string) {
        try {
            const sql = `SELECT KEY FROM ${TableName.GroupKey} INDEXED BY index_keyId WHERE KEY_ID = ?`;
            const result = await this.dataSource.get(sql, [keyId]);
            return result ? result['KEY'] : null;
        } catch (e) {
            console.log(e)
        }
    }
    /**
     * 删除指定group下的所有密钥
     */
    public async deleteGroupKeys(targetId: string) {
        try {
            console.log(targetId);
            const sql = `DELETE FROM ${TableName.GroupKey} WHERE GROUP_ID = ?`;
            return await this.dataSource.run(sql, [targetId])
        } catch (e) {
            console.log(e)
        }
    }
}

