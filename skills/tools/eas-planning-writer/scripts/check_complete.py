#!/usr/bin/env python3
"""
检查 task_plan.md 中的所有阶段是否完成
由 Stop hook 使用以报告任务完成状态
"""

import os
import sys

def check_complete(plan_file: str = 'task_plan.md') -> None:
    """检查任务完成状态"""
    try:
        # 检查 task_plan.md 是否存在
        if not os.path.exists(plan_file):
            print('[eas-planning-writer] No task_plan.md found — no active planning session.')
            return

        # 读取计划文件
        with open(plan_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 计算总阶段数
        total_phases = content.count('### Phase')

        # 检查 **Status:** 格式
        complete_count = content.count('**Status:** complete')
        in_progress_count = content.count('**Status:** in_progress')
        pending_count = content.count('**Status:** pending')

        # 如果 **Status:** 格式沒有找到，則檢查 [complete] 格式
        if complete_count == 0 and in_progress_count == 0 and pending_count == 0:
            complete_count = content.count('[complete]')
            in_progress_count = content.count('[in_progress]')
            pending_count = content.count('[pending]')

        # 报告狀態（總是退出 0 — 不完整的任務是正常狀態）
        if complete_count > 0 and complete_count == total_phases and total_phases > 0:
            print(f'[eas-planning-writer] ALL PHASES COMPLETE ({complete_count}/{total_phases})')
        else:
            print(f'[eas-planning-writer] Task in progress ({complete_count}/{total_phases} phases complete)')
            if in_progress_count > 0:
                print(f'[eas-planning-writer] {in_progress_count} phase(s) still in progress.')
            if pending_count > 0:
                print(f'[eas-planning-writer] {pending_count} phase(s) pending.')

        # 總是退出 0 — 不完整任務是正常狀態
        sys.exit(0)
    except Exception as e:
        print(f'Error checking completion status: {e}', file=sys.stderr)
        sys.exit(1)

def main():
    """主函数"""
    args = sys.argv[1:]
    plan_file = args[0] if args else 'task_plan.md'
    check_complete(plan_file)

if __name__ == '__main__':
    main()