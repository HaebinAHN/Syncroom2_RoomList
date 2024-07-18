// RoomGrid.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Card, CardContent, Avatar, Typography, FormControlLabel, Checkbox, Divider, AppBar, Box, Button } from '@mui/material';
import { styled } from '@mui/system';
import usePushNotification from './usePushNotification';

const Logo = styled('img')({
    marginRight: '10px',
});

interface AvatarPreset {
    colorCode: string;
    shapeKey: string;
}

interface UserAvatar {
    type: string;
    url?: string;
    preset?: AvatarPreset;
}

interface User {
    userId: string;
    nickname: string;
    idProvider: string;
    avatar: UserAvatar;
    isBeginner: boolean;
    lastPlayedPart: {
        part: string;
        customPart?: string;
    };
}

interface Room {
    roomId: string;
    name: string;
    description: string;
    roomPurpose: string;
    roomPublishType: string;
    needPasswd: boolean;
    roomStatus: string;
    tags: string[];
    customTags: string[];
    isTestRoom: boolean;
    ownerUser: User;
    members: User[];
}

const RoomGrid: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [needPassword, setNeedPassword] = useState<{ withPass: boolean, withoutPass: boolean }>({ withPass: true, withoutPass: true });
    const [filterKorean, setFilterKorean] = useState<boolean>(true);
    const [filterJapanese, setFilterJapanese] = useState<boolean>(true);

    const [subscribeList, setSubscribeList] = useState<string[]>([]);
    const findRoomById = (rooms: Room[], roomId: string): Room | undefined => {
        return rooms.find(room => room.roomId === roomId);
    };

    const handleButtonClick = (roomId: string) => {
        if (subscribeList.includes(roomId)) {
            setSubscribeList(subscribeList.filter(e => e !== roomId))
        }
        else {
            setSubscribeList([...subscribeList, roomId])
        }
        console.log(subscribeList);
    };

    const { fireNotification } = usePushNotification();

    const handleNotification = (title: string, options: NotificationOptions) => {
        if (fireNotification) {
            fireNotification(title, options);
        } else {
            console.error('fireNotification function is not available');
        }
    };

    const fetchRooms = () => {
        axios.get('https://webapi.syncroom.appservice.yamaha.com/rooms/guest/online')
            .then(response => {
                setRooms(response.data.rooms);
                setFilteredRooms(response.data.rooms);
            })
            .catch(error => {
                console.error('There was an error fetching the rooms!', error);
            });
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 10000); // 10초마다 fetchRooms 호출
        return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
    }, []);

    useEffect(() => {
        for (let idx = 0; idx < subscribeList.length; idx++) {
            const room = findRoomById(rooms, subscribeList[idx]);
            if (room && room.members.length < 6) {
                handleNotification(`${room.name}에 입장 가능합니다!`, {
                    body: `${room.name} 방 인원이 6명 미만입니다.`,
                });
                setSubscribeList(subscribeList.filter(e => e !== subscribeList[idx]))
            }
        }
    }, [subscribeList, rooms]);

    useEffect(() => {
        applyFilters();
    }, [needPassword, filterKorean, filterJapanese, rooms]);

    const applyFilters = () => {
        let filtered = rooms.filter(room => room.members.length > 0); // 멤버가 있는 방만 필터링

        if (!(needPassword.withPass && needPassword.withoutPass)) {
            filtered = filtered.filter(room =>
                (needPassword.withPass && room.needPasswd) ||
                (needPassword.withoutPass && !room.needPasswd)
            );
        }

        if (filterKorean && !filterJapanese) {
            filtered = filtered.filter(room => room.ownerUser.idProvider === 'ymid-kr');
        }

        if (filterJapanese && !filterKorean) {
            filtered = filtered.filter(room => room.ownerUser.idProvider === 'ymid-jp');
        }

        if (!filterKorean && !filterJapanese) {
            filtered = filtered.filter(room => (room.name === 'Official Test Room' && room.ownerUser.nickname === 'SYNCROOM_bot'));
            setFilteredRooms(filtered);
            return;
        }

        setFilteredRooms(filtered);
    };

    const handlePasswordFilterChange = (filterType: 'withPass' | 'withoutPass') => {
        setNeedPassword(prevState => ({
            ...prevState,
            [filterType]: !prevState[filterType]
        }));
    };

    return (
        <Box sx={{ backgroundColor: '#DFE3F9', pb: '3rem', minHeight: '100vh' }}>
            <AppBar position="static">
                <Box display="flex" alignItems="center" justifyContent="center" width="100%">
                    <Typography variant="h6">싱크룸2 방 목록 made by 노가리잇</Typography>
                </Box>
            </AppBar>
            <Box display="flex" alignItems="center" justifyContent="center" width="100%" marginTop="2rem">
                <Logo src={`${process.env.PUBLIC_URL}/logo_header_sync.png`} alt="Logo" height="50" />
            </Box>
            <Card sx={{ margin: 4, paddingLeft: 4 }}>
                <CardContent>
                    <Typography variant="h5">필터</Typography><br />
                    <Grid container>
                        <Grid item xs={12} sm={6} md={6}>
                            <Typography variant='h6'> 비밀번호 </Typography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={needPassword.withPass}
                                        onChange={() => handlePasswordFilterChange('withPass')}
                                        color="primary"
                                    />
                                }
                                label="비밀번호 있음"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={needPassword.withoutPass}
                                        onChange={() => handlePasswordFilterChange('withoutPass')}
                                        color="primary"
                                    />
                                }
                                label="비밀번호 없음"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                            <Typography variant='h6'>국가</Typography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filterKorean}
                                        onChange={() => setFilterKorean(!filterKorean)}
                                        color="primary"
                                    />
                                }
                                label="한국"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filterJapanese}
                                        onChange={() => setFilterJapanese(!filterJapanese)}
                                        color="primary"
                                    />
                                }
                                label="일본"
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <Divider />
            <Typography padding={4}>● 방장 닉네임은 파란색으로 표시됩니다.</Typography>
            <Grid container spacing={4} paddingLeft={4} paddingRight={4}>
                {filteredRooms.map((room) => (
                    <Grid item xs={12} sm={6} md={6} key={room.roomId}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5">{room.needPasswd ? '🔒' + room.name : room.name}</Typography>
                                <Typography variant="subtitle1" minHeight='5em'>{room.description}</Typography>
                                <Grid container spacing={2}>
                                    {room.members.map((member) => (
                                        <Grid item xs={4} md={3} lg={2} key={member.userId}>
                                            <Card>
                                                <CardContent style={{ height: '5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Avatar
                                                        src={room.name === 'Official Test Room' && member.nickname === 'SYNCROOM_bot'
                                                            ? `${process.env.PUBLIC_URL}/avatars/avatar_user2_e9ebff.png`
                                                            : member.avatar.type === 'preset'
                                                                ? `${process.env.PUBLIC_URL}/avatars/avatar_${member.avatar.preset?.shapeKey}_${member.avatar.preset?.colorCode}.png`
                                                                : member.avatar.url}
                                                        alt={member.nickname}
                                                        style={{
                                                            marginTop: '-0.1rem',
                                                            marginBottom: '0.5rem',
                                                            backgroundColor: member.avatar.type === 'preset' ? member.avatar.preset?.colorCode : 'transparent',
                                                        }}
                                                    >
                                                        {member.avatar.type === 'preset' && !member.avatar.url && member.avatar.preset?.shapeKey}
                                                    </Avatar>
                                                    <Typography variant="caption" style={{ color: room.ownerUser.userId === member.userId ? 'blue' : 'inherit' }}>{member.nickname}</Typography>
                                                    <Typography
                                                        variant="caption"
                                                        style={{ display: 'block', color: 'gray' }}
                                                    >
                                                        {member.lastPlayedPart.customPart
                                                            ? member.lastPlayedPart.customPart
                                                            : member.lastPlayedPart.part}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                <Box textAlign={'right'} marginTop={'1rem'}>
                                    {room.members.length === 6 && (<Button variant={subscribeList.includes(room.roomId) ? 'outlined' : 'contained'} color="secondary" onClick={() => handleButtonClick(room.roomId)}>
                                        {subscribeList.includes(room.roomId) ? '알림 대기중...' : '🔔자리나면 알림받기'}</Button>)} &nbsp;
                                    <Button
                                        component="a"
                                        href={`https://webapi.syncroom.appservice.yamaha.com/launch_app?roomName=${room.name}&roomId=${room.roomId}&requirePassword=${room.needPasswd ? '1' : '0'}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="contained"
                                        color="primary">룸 입장하기</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default RoomGrid;
