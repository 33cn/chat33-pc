// todo 声明所有api
declare namespace api {
  /**
   * 返回数据基本格式
   */
  export interface Response<T> {
    result: number; // 0 为成功
    message: string;
    data: T;
  }
}
