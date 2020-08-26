/**
 * 消息类
 * @author zhoudi
 * @date 2019-05-09
 * @desc
 */

import TextMsg, {TextMsgConfig} from '@/object/messages/TextMsg';
import AudioMsg, {AudioMsgConfig} from '@/object/messages/AudioMsg';
import ImageMsg, {ImageMsgConfig} from '@/object/messages/ImageMsg';
import FileMsg, {FileMsgConfig} from '@/object/messages/FileMsg';
import VideoMsg, {VideoMsgConfig} from '@/object/messages/VideoMsg';
import GroupAnnounce, {GroupAnnounceConfig} from '@/object/messages/GroupAnnounce';
import MultiRelayMsg, {MultiRelayMsgConfig} from '@/object/messages/MultiRelayMsg';
import PayMsg, {PayMsgConfig} from '@/object/messages/PayMsg';
import SnapAudioMsg, {SnapAudioMsgConfig} from '@/object/messages/snapMsg/SnapAudioMsg';
import SnapImageMsg, {SnapImageMsgConfig} from '@/object/messages/snapMsg/SnapImageMsg';
import SnapTextMsg, {SnapTextMsgConfig} from '@/object/messages/snapMsg/SnapTextMsg';
import RelayFileMsg, {RelayFileMsgConfig} from '@/object/messages/singleRelay/RelayFileMsg';
import RelayImageMsg, {RelayImageMsgConfig} from '@/object/messages/singleRelay/RelayImageMsg';
import RelayTextMsg, {RelayTextMsgConfig} from '@/object/messages/singleRelay/RelayTextMsg';
import RelayVideoMsg, {RelayVideoMsgConfig} from '@/object/messages/singleRelay/RelayVideoMsg';
import LabelNotice, {LabelNoticeConfig} from '@/object/messages/notice/LabelNotice';
import PayNotice, {PayNoticeConfig} from '@/object/messages/notice/PayNotice';
import PacketMsg, {PacketMsgConfig} from '@/object/messages/PacketMsg';
import LikeNotice from '@/object/messages/notice/LikeNotice';

type CommonMsg = TextMsg | AudioMsg | ImageMsg | FileMsg | VideoMsg | MultiRelayMsg
  | PacketMsg | PayMsg | GroupAnnounce;
export type Notice = LabelNotice | PayNotice | LikeNotice;
type SnapMsg = SnapAudioMsg | SnapImageMsg | SnapTextMsg;
type RelayMsg = RelayFileMsg | RelayImageMsg | RelayTextMsg | RelayVideoMsg;

export type MessageType = CommonMsg | Notice | SnapMsg | RelayMsg;

type CommonMsgConfig = TextMsgConfig | AudioMsgConfig | ImageMsgConfig | FileMsgConfig | VideoMsgConfig
  | MultiRelayMsgConfig | PacketMsgConfig | PayMsgConfig | GroupAnnounceConfig;
type NoticeConfig = LabelNoticeConfig | PayNoticeConfig;
type SnapMsgConfig = SnapAudioMsgConfig | SnapImageMsgConfig | SnapTextMsgConfig;
type RelayMsgConfig = RelayFileMsgConfig | RelayImageMsgConfig | RelayTextMsgConfig | RelayVideoMsgConfig;

export type MessageConfig = CommonMsgConfig | NoticeConfig | SnapMsgConfig | RelayMsgConfig;
