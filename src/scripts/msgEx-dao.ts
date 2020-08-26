import Datasource from '@/scripts/data-source';
import Dao from '@/scripts/dao';
import { TableName } from '@/config/config-enum';
import { ApiMsg } from '@/config/apiTypings';
import Notify from '@/plugins/NotifyPop';

export default class FriendDao extends Dao {
    constructor(dataSource: Datasource) {
        super(dataSource)
    }

    async createFriendMsgTable() {
        let sql = `CREATE TABLE IF NOT EXISTS ${TableName.FriendChatLog} (
            LOG_ID INTEGER PRIMARY KEY NOT NULL,
            FRIEND_ID CHAR(10),
            FROM_ID CHAR(10),
            TARGET_ID CHAR(10),
            MSG_TYPE TINYINT, 
            MESSAGE VARCHAR(65532),
            TIME BIGINT,
            SENDER_NAME NCHAR(50),
            SENDER_AVATAR CHAR(255),
            IS_SNAP TINYINT,
            PRAISE CHAR(255)
            ) WITHOUT ROWID`
        try {
            const res = await this.dataSource.get(`SELECT count(*) FROM sqlite_master WHERE type='table' AND name = '${TableName.FriendChatLog}'`);
            if (!res) {
                sql += `;CREATE INDEX index_friendId ON ${TableName.FriendChatLog} (FRIEND_ID);`
            }
            return await this.dataSource.exec(sql);
        } catch (error) {

        }
    }

    async createGroupMsgTable() {
        let sql = `CREATE TABLE IF NOT EXISTS ${TableName.GroupChatLog} (
            LOG_ID INTEGER PRIMARY KEY NOT NULL,
            GROUP_ID CHAR(10),
            FROM_ID CHAR(10),
            TARGET_ID CHAR(10),
            MSG_TYPE TINYINT,
            MESSAGE VARCHAR(65532),
            TIME BIGINT,
            SENDER_NAME NCHAR(50),
            SENDER_AVATAR CHAR(255),
            IS_SNAP TINYINT,
            PRAISE CHAR(255)
            ) WITHOUT ROWID`
        try {
            const res = await this.dataSource.get(`SELECT count(*) FROM sqlite_master WHERE type='table' AND name = '${TableName.GroupChatLog}'`);
            if (!res) {
                sql += `;CREATE INDEX index_groupId ON ${TableName.GroupChatLog} (GROUP_ID)`
            }
            return await this.dataSource.exec(sql);
        } catch (error) {

        }
    }

    private createNEWFriendMsgTable() {
        let sql = `CREATE TABLE IF NOT EXISTS FriendChatTemp (
            LOG_ID INTEGER PRIMARY KEY NOT NULL,
            FRIEND_ID CHAR(10),
            FROM_ID CHAR(10),
            TARGET_ID CHAR(10),
            MSG_TYPE TINYINT, 
            MESSAGE VARCHAR(65532),
            TIME BIGINT,
            SENDER_NAME NCHAR(50),
            SENDER_AVATAR CHAR(255),
            IS_SNAP TINYINT,
            PRAISE CHAR(255)
            ) WITHOUT ROWID`

        sql += `;CREATE INDEX index_friendId
        on FriendChatTemp (FRIEND_ID)`

        return this.dataSource.exec(sql).catch((error: any) => {
            console.error(error);
        })
    }

    private createNEWGroupMsgTable() {
        let sql = `CREATE TABLE IF NOT EXISTS GroupChatTemp (
            LOG_ID INTEGER PRIMARY KEY NOT NULL,
            GROUP_ID CHAR(10),
            FROM_ID CHAR(10),
            TARGET_ID CHAR(10),
            MSG_TYPE TINYINT,
            MESSAGE VARCHAR(65532),
            TIME BIGINT,
            SENDER_NAME NCHAR(50),
            SENDER_AVATAR CHAR(255),
            IS_SNAP TINYINT,
            PRAISE CHAR(255)
            ) WITHOUT ROWID`

        sql += `;CREATE INDEX index_groupId
        on GroupChatTemp (GROUP_ID)`

        return this.dataSource.exec(sql).catch((error: any) => {
            console.error(error);
        })
    }

    /**
    *  更新本地数据库
    */
    public async updateLocalDb(tableName: TableName) {
        try {
            const getStructureSql = `PRAGMA table_info(${tableName})`;
            const results: any[] = await this.dataSource.all(getStructureSql);
            const snapExist = results.find((item) => item.name === 'IS_SNAP'); // v2.2.0版本更新：增加-IS_SNAP
            const praiseExist = results.find((item) => item.name === 'PRAISE');// v2.8.0版本更新：增加-PRAISE
            if (!snapExist) {
                await this.addIsSnap(tableName);
            }
            if (!praiseExist) {
                await this.addPraise(tableName);
            }
            const hasIndex = await this.dataSource.get(`SELECT * FROM sqlite_master WHERE type = 'index' AND tbl_name = "${tableName}"`)
            if (!hasIndex) {
                this.updateColumn(tableName);
            }
        } catch (e) {
        }
    }

    /**
     * 创建新的表结构
     * @param COLUMN
     */
    private updateColumn(tableName: string) {
        const isGroup = tableName === TableName.GroupChatLog;
        this.dataSource.db.serialize(() => {
            this.dataSource.db.run("BEGIN TRANSACTION");//开启数据库事务
            isGroup ? this.createNEWGroupMsgTable() : this.createNEWFriendMsgTable();
            this.dataSource.run(`INSERT OR IGNORE INTO ${isGroup ? 'GroupChatTemp' : 'FriendChatTemp'} (LOG_ID,${isGroup ? 'GROUP_ID' : 'FRIEND_ID'},FROM_ID,TARGET_ID,MSG_TYPE,MESSAGE,TIME,SENDER_NAME,SENDER_AVATAR,IS_SNAP) SELECT LOG_ID,${isGroup ? 'GROUP_ID' : 'FRIEND_ID'},FROM_ID,TARGET_ID,MSG_TYPE,MESSAGE,TIME,SENDER_NAME,SENDER_AVATAR,IS_SNAP FROM ${isGroup ? TableName.GroupChatLog : TableName.FriendChatLog}`);
            this.dataSource.run(`DROP TABLE ${isGroup ? TableName.GroupChatLog : TableName.FriendChatLog}`);
            isGroup ? this.dataSource.run(`ALTER TABLE GroupChatTemp RENAME TO ${TableName.GroupChatLog}`) :
                this.dataSource.run(`ALTER TABLE FriendChatTemp RENAME TO ${TableName.FriendChatLog}`);
            this.dataSource.db.run("COMMIT TRANSACTION");
        })
    }

    public addIsSnap(tableName: string) {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN IS_SNAP INTEGER`;
        return this.dataSource.run(sql, []);
    }

    public addPraise(tableName: string) {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN PRAISE CHAR(255)`;
        return this.dataSource.run(sql, []);
    }
    /**
     * 批量插入对话消息
     */
    public batchInserts(targetId: string, logs: ApiMsg[], isGroup: boolean) {
        try {
            this.dataSource.db.serialize(() => {
                const tableName = isGroup ? TableName.GroupChatLog : TableName.FriendChatLog;
                this.dataSource.db.run("BEGIN TRANSACTION");//开启数据库事务
                const stmt = this.dataSource.db.prepare(`INSERT OR IGNORE INTO ${tableName} VALUES (?,?,?,?,?,?,?,?,?,?,?);`);
                logs.forEach((item: ApiMsg) => { // todo 异常处理错误
                    stmt.run([item.logId, targetId, item.fromId, item.targetId, item.msgType, JSON.stringify(item.msg),
                    item.datetime, item.senderInfo.nickname, item.senderInfo.avatar, item.isSnap, JSON.stringify(item.praise)]);
                });
                stmt.finalize((error: any) => {
                    if (error) {
                        Notify.fail('本地存储失败');
                        throw new Error('本地保存失败');
                    }
                });
                this.dataSource.db.run("COMMIT TRANSACTION");
            });
        } catch (error) {
            console.error(error);
        }
    }

    public clearOnesLogs(targetId: string, isGroup: boolean) {
        const sql = `DELETE FROM ${isGroup ? TableName.GroupChatLog : TableName.FriendChatLog} WHERE ${isGroup ? 'GROUP_ID' : 'FRIEND_ID'} = ?`
        return this.dataSource.run(sql, [targetId]).catch((error: any) => {
            console.error(error);
        })
    }

    public deleteOneLog(msgLogId: string, isGroup: boolean) {
        const sql = `DELETE FROM ${isGroup ? TableName.GroupChatLog : TableName.FriendChatLog} WHERE LOG_ID = ?`;
        return this.dataSource.run(sql, [msgLogId]).catch((error: any) => {
            console.error(error);
        })
    }

    /**
    * 获取本地数据库聊天记录
    */
    public async getRangeLogs(targetId: string, startId: string, count: number, isGroup: boolean) {
        try {
            const sql = `SELECT * FROM ${isGroup ? TableName.GroupChatLog : TableName.FriendChatLog} INDEXED BY ${isGroup ? 'index_groupId' : 'index_friendId'}
          WHERE ${isGroup ? 'GROUP_ID' : 'FRIEND_ID'} = ${targetId} ${startId ? `AND LOG_ID <= ${Number(startId)}` : ''}
          ORDER BY LOG_ID DESC LIMIT ${count + 1}`;
            return await this.dataSource.all(sql, [])
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * 根据logid查找消息
     */
    public async getLog(logId: string, isGroup: boolean) {
        try {
            const sql = `SELECT * FROM ${isGroup ? TableName.GroupChatLog : TableName.FriendChatLog} WHERE LOG_ID = ?`;
            const result = await this.dataSource.get(sql, [logId]);
            return result || null;
        } catch (e) {
            console.log(e)
        }
    }

    /**
     * 更新赞赏数
     */
    public async updatePraise(praise: string, logId: string, isGroup: boolean) {
        try {
            const sql = `UPDATE ${isGroup ? TableName.GroupChatLog : TableName.FriendChatLog} SET PRAISE = ? WHERE LOG_ID = ?`;
            const result = await this.dataSource.run(sql, [praise, logId]);
            return result;
        } catch (e) {
            console.log(e)
        }
    }

    /**
    * 清空缓存（每个对象仅保留最新n条）
    */
    public clearAllOldLogs() {
        // do nothing
    };
}