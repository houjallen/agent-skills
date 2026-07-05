#!/usr/bin/env python3
"""
eas-planning-writer 技能测试脚本
验证所有脚本是否正常工作并与技能定义保持一致
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple, Optional

def run_command(cmd: str, cwd: Optional[str] = None) -> Tuple[int, str, str]:
    """运行命令并返回输出"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=True, 
            text=True, 
            cwd=cwd
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)

def test_script_execution(script_path: str, test_args: Optional[List[str]] = None) -> bool:
    """测试脚本是否能正常执行"""
    if not os.path.exists(script_path):
        print(f"Script does not exist: {script_path}")
        return False
    
    print(f"Testing script execution: {script_path}")
    
    cmd = f"python {script_path}"
    if test_args:
        cmd += " " + " ".join(test_args)
    
    return_code, stdout, stderr = run_command(cmd)
    
    if return_code == 0:
        print(f"SUCCESS: Script executed successfully: {script_path}")
        return True
    else:
        print(f"FAILED: Script execution failed: {script_path}")
        print(f"   Return code: {return_code}")
        print(f"   Stdout: {stdout}")
        print(f"   Stderr: {stderr}")
        return False

def test_python_scripts():
    """测试 Python 脚本"""
    print("\nTesting Python scripts")
    print("="*50)
    
    scripts_dir = Path(__file__).parent
    results = {}
    
    # 测试 session-catchup.py
    script_path = scripts_dir / "session-catchup.py"
    results["session-catchup.py"] = test_script_execution(str(script_path), ["--help"]) if script_path.exists() else False
    
    # 测试新添加的脚本
    init_script = scripts_dir / "init_planning_session.py"
    results["init_planning_session.py"] = test_script_execution(str(init_script), ["--help"]) if init_script.exists() else False
    
    check_script = scripts_dir / "check_complete.py"
    results["check_complete.py"] = test_script_execution(str(check_script), ["--help"]) if check_script.exists() else False
    
    return results

def test_shell_scripts():
    """测试 Shell/Bash 脚本"""
    print("\nTesting Shell/Bash scripts")
    print("="*50)
    
    scripts_dir = Path(__file__).parent
    results = {}
    
    # 测试 check-complete.sh
    script_path = scripts_dir / "check-complete.sh"
    if script_path.exists():
        print(f"Testing script execution: {script_path}")
        return_code, stdout, stderr = run_command(f"bash {script_path}")
        if return_code == 0 or return_code == 1:  # 1 通常是正常情况（未找到task_plan.md）
            print(f"SUCCESS: Script executed successfully: {script_path}")
            results["check-complete.sh"] = True
        else:
            print(f"FAILED: Script execution failed: {script_path}")
            print(f"   Return code: {return_code}, Error: {stderr}")
            results["check-complete.sh"] = False
    else:
        print(f"Script does not exist: {script_path}")
        results["check-complete.sh"] = False
    
    # 测试 init-session.sh
    script_path = scripts_dir / "init-session.sh"
    if script_path.exists():
        print(f"Testing script execution: {script_path}")
        return_code, stdout, stderr = run_command(f"bash {script_path}")
        if return_code == 0 or "Planning files initialized" in stdout:
            print(f"SUCCESS: Script executed successfully: {script_path}")
            results["init-session.sh"] = True
        else:
            print(f"FAILED: Script execution failed: {script_path}")
            print(f"   Return code: {return_code}, Error: {stderr}")
            results["init-session.sh"] = False
    else:
        print(f"Script does not exist: {script_path}")
        results["init-session.sh"] = False
    
    return results

def test_functionality():
    """测试功能完整性"""
    print("\nTesting functionality")
    print("="*50)
    
    # 创建临时目录进行测试
    import tempfile
    import shutil
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"Using temp directory: {temp_dir}")
        
        # 测试创建规划文件
        init_script = Path(__file__).parent / "init_planning_session.py"
        if init_script.exists():
            print("Testing planning file creation...")
            
            # 创建 docs/task 目录
            task_dir = Path(temp_dir) / "docs" / "task"
            task_dir.mkdir(parents=True, exist_ok=True)
            
            # 运行初始化脚本
            cmd = f"python {init_script} --output {task_dir}"
            return_code, stdout, stderr = run_command(cmd, cwd=temp_dir)
            
            if return_code == 0:
                # 检查文件是否创建成功
                task_plan = task_dir / "task_plan.md"
                findings = task_dir / "findings.md"  
                progress = task_dir / "progress.md"
                
                success_count = 0
                for file_path in [task_plan, findings, progress]:
                    if file_path.exists():
                        print(f"SUCCESS: File created: {file_path.name}")
                        success_count += 1
                    else:
                        print(f"FAILED: File creation failed: {file_path.name}")
                
                if success_count == 3:
                    print("SUCCESS: Planning file creation functionality intact")
                    return True
                else:
                    print("FAILED: Planning file creation functionality is incomplete")
                    return False
            else:
                print(f"FAILED: Planning file creation script execution failed: {stderr}")
                return False
        else:
            print("Initialization script does not exist, skipping functionality test")
            return True

def main():
    """主测试函数"""
    print("EAS-PLANNING-WRITER Skill Validation Test")
    print("="*60)
    
    # 测试 Python 脚本
    python_results = test_python_scripts()
    
    # 测试 Shell 脚本
    shell_results = test_shell_scripts()
    
    # 测试功能完整性
    functionality_result = test_functionality()
    
    # 汇总结果
    print("\nTest Results Summary")
    print("="*60)
    
    all_results = {**python_results, **shell_results}
    
    for script, success in all_results.items():
        status = "SUCCESS" if success else "FAILED"
        print(f"[{status}] {script}: {'PASS' if success else 'FAIL'}")
    
    print(f"\nFunctionality test: {'SUCCESS' if functionality_result else 'FAILED'}")
    
    # 计算成功率
    total_tests = len(all_results) + (1 if functionality_result is not None else 0)
    passed_tests = sum(1 for result in all_results.values() if result) + (1 if functionality_result else 0)
    
    print(f"\nOverall Pass Rate: {passed_tests}/{total_tests} ({passed_tests/total_tests*100:.1f}%)")
    
    if all(result for result in all_results.values()) and functionality_result:
        print("\nAll tests passed! eas-planning-writer skill validation successful.")
        return 0
    else:
        print(f"\nSome tests failed. Please check if scripts align with skill definition.")
        return 1

if __name__ == "__main__":
    sys.exit(main())