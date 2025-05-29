'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  Link as MuiLink, // Renamed to avoid conflict with React Router Link if used later
} from '@mui/material';
import { ResultPanelProps } from '@/types';
import { getTraitMoegirlLink } from '@/utils/linkUtils';

export default function ResultPanel({ results, onCalculate, ratings }: ResultPanelProps) {
  const validRatingCount = Object.values(ratings || {})
    .filter(rating => rating.score !== -1)
    .length;
  
  const skippedCount = Object.values(ratings || {})
    .filter(rating => rating.score === -1)
    .length;
  
  const [traitLinks, setTraitLinks] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const loadTraitLinks = async () => {
      try {
        const response = await fetch('/data/trait_links.json');
        if (response.ok) {
          const data = await response.json();
          setTraitLinks(data);
          console.log('[ResultPanel] 已加载萌属性链接数据:', Object.keys(data).length);
        } else {
          console.error('[ResultPanel] 加载萌属性链接数据失败, status:', response.status);
        }
      } catch (error) {
        console.error('[ResultPanel] 加载萌属性链接数据失败:', error);
      }
    };
    
    loadTraitLinks();
  }, []);
  
  const isInfoResult = (results: Array<{ trait: string; score: number }>) => {
    return results.length > 0 && results[0].trait === "评分结果" && results.every(r => r.score === 0);
  };

  const sortedResults = [...results].sort((a, b) => b.score - a.score) as Array<{ trait: string; score: number; moegirl_link?: string }>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        偏好结果
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.9rem' }}>
        已评分角色数量: {validRatingCount}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.9rem' }}>
        已跳过角色数量: {skippedCount}
      </Typography>

      <Button 
        variant="contained" 
        onClick={onCalculate} 
        fullWidth 
        sx={{ 
          mb: 3,
          textTransform: 'none',
          fontSize: '0.9rem'
        }}
        disabled={validRatingCount === 0}
      >
        {validRatingCount > 0 ? "重新计算结果" : "请先评分"}
      </Button>

      <Divider sx={{ mb: 2 }} />

      {isInfoResult(results) ? (
        <Alert severity="info" sx={{ fontSize: '0.9rem' }}>
          {results.map((item, index) => (
            <div key={index}>{item.trait}</div>
          ))}
        </Alert>
      ) : results.length > 0 ? (
        <TableContainer component={Paper} elevation={2}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>萌属性</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>偏好得分</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedResults.map(({ trait, score, moegirl_link }) => {
                  const moegirlLink = getTraitMoegirlLink(trait, moegirl_link, traitLinks);
                  const cellContent = moegirlLink ? (
                    <MuiLink 
                      href={moegirlLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{ 
                        color: 'inherit', // Inherit color from TableCell
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                      }}
                    >
                      {trait}
                    </MuiLink>
                  ) : (
                    trait 
                  );

                  return (
                    <TableRow
                      key={trait}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: score > 0 ? 'rgba(76, 175, 80, 0.1)' : score < 0 ? 'rgba(255, 82, 82, 0.1)' : 'transparent', // Lighter shades
                        '&:hover': {
                          backgroundColor: score > 0 ? 'rgba(76, 175, 80, 0.2)' : score < 0 ? 'rgba(255, 82, 82, 0.2)' : 'action.selected',
                          // '& a': { color: score !== 0 ? 'white' : 'inherit' } // Adjust link color on hover if needed
                        }
                      }}
                    >
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ fontSize: '0.9rem' }}
                      >
                        {cellContent}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontSize: '0.9rem',
                          fontWeight: score > 0.5 || score < -0.5 ? 'bold' : 'normal', // Bold if score is significant
                          color: score > 0 ? 'success.dark' : score < 0 ? 'error.dark' : 'text.primary',
                        }}
                      >
                        {score.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )
       : (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center"
          sx={{ fontSize: '0.9rem' }}
        >
          {validRatingCount > 0 ? "点击计算结果按钮生成结果" : "请先进行一些评分，然后点击计算结果"}
        </Typography>
      )}
      
    </Box>
  );
}