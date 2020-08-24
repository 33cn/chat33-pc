import { fsExtra } from 'fs-extra';
import { TableName } from '@/config/config-enum';
import sqlite3 from 'sqlite3';
import electron from 'electron';
import path from 'path';
import {ChannelType, MsgDetailType, MsgType } from '@/config/const-enums';

const sqlite = sqlite3.verbose();
const isDisableMode = false;

class Datasource{ // todo 确定数据库相关保存接口字段，与本地字段无关
  private static instance: Datasource|null
  public static getInstance(id?:string):Datasource{
    if(!this.instance){
      const userDir = (electron.app || electron.remote.app).getPath('userData');
      const dbPath = path.join(userDir, `user${id}.db`);
      console.info('数据库文件路径:', dbPath);
      this.instance = new Datasource(dbPath);
    }
    return this.instance
  }
  public static removeInstance(o:any = null):void{
    this.instance = null;
  }
  public db:any
  private constructor(dbPath:string){
    this.db = new sqlite.Database(dbPath, (err: any) => {
      if (err) {
        console.log(err);
      } else {
        console.log('连接数据库成功');
      }
    });
  }

  public run(sql:string,params = []){
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err:any) {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve('success')
        }
      })
    })
  }

  public get(sql:string, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err:any, result:any) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  public all(sql:string, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err:any, rows:any[]) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  public exec(sql:string){
    return new Promise((resolve, reject) => {
      this.db.exec(sql,(err:any)=>{
        if(err) {
          reject(err)
        } else {
          resolve('successs')
        }
      });
    })
  }

  public each(){
  }

  public closeDB() {
    this.db.close();
  }
};

export default Datasource;